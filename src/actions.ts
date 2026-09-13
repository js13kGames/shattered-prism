/**
 * # Actions
 *
 * Cross-cutting game events. `start` is what the UI button calls through
 * `window.$`; the other functions are what systems call.
 */

import {AudioClip} from "../lib/audio.js";
import {instantiate} from "../lib/game.js";
import {mat4_get_forward, mat4_get_translation} from "../lib/mat4.js";
import {Vec3} from "../lib/math.js";
import {float, integer} from "../lib/random.js";
import {vec3_distance} from "../lib/vec3.js";
import {Entity} from "../lib/world.js";
import {blueprint_burst, blueprint_drop} from "./blueprints/blu_effects.js";
import {blueprint_viewmodel} from "./blueprints/blu_viewmodel.js";
import {children, destroy_all} from "./components/com_children.js";
import {Pickup} from "./components/com_gameplay.js";
import {RigidKind} from "./components/com_rigid_body.js";
import {set_position, set_scale} from "./components/com_transform.js";
import {Game, GameState} from "./game.js";
import {blueprint_crate, scene_level} from "./level.js";
import {snd_boom, snd_explode, snd_hit, snd_hurt, snd_pickup, snd_switch} from "./sounds.js";
import {WEAPONS} from "./weapons.js";
import {Has} from "./world.js";

/** Start a new run. */
export function start(game: Game) {
    // The AudioContext only starts from a user gesture, and this only ever
    // runs from a click on the title screen.
    game.Audio.resume();
    scene_level(game);
    switch_weapon(game, 0, true);
    game.State = GameState.Playing;
}

/**
 * Where the player is looking. The eye entity carries the pitch and hangs off
 * the yaw rig, so its forward axis is the aim, and its position is the muzzle.
 */
export function aim_forward(game: Game, out: Vec3) {
    return mat4_get_forward(out, game.World.Transform[game.PlayerEye].World);
}

export function aim_origin(game: Game, out: Vec3) {
    return mat4_get_translation(out, game.World.Transform[game.PlayerEye].World);
}

/** Play a one-shot clip from an entity that has an AudioSource. */
export function play(game: Game, entity: Entity, clip: AudioClip) {
    if (game.World.Signature[entity] & Has.AudioSource) {
        game.World.AudioSource[entity].Trigger = clip;
    }
}

/** Kick the camera. The shake decays on its own in sys_shake. */
export function shake_camera(game: Game, radius: number) {
    if (game.World.Signature[game.PlayerCamera] & Has.Shake) {
        let shake = game.World.Shake[game.PlayerCamera];
        shake.Radius = Math.max(shake.Radius, radius);
    }
}

/** Put a different gun in the player's hands, and build its model. */
export function switch_weapon(game: Game, slot: number, force = false) {
    if (!WEAPONS[slot] || (slot === game.Weapon && !force)) {
        return;
    }

    game.Weapon = slot;

    // The holder has no Children component until the first weapon is built.
    let holder = game.World.Children[game.Viewmodel];
    if (holder) {
        for (let child of holder.Children) {
            destroy_all(game.World, child);
        }
        holder.Children.length = 0;
    }

    children(blueprint_viewmodel(slot))(game, game.Viewmodel);
    // Raise the new gun into frame rather than snapping it there.
    game.Recoil = 1;
    play(game, game.PlayerEntity, snd_switch);
}

/** Take a pickup, if it is worth anything. Returns whether it was consumed. */
export function collect(game: Game, item: Pickup) {
    let taken = false;
    let health = game.World.Health[game.PlayerEntity];

    if (item.Heal && health.Current < health.Max) {
        health.Current = Math.min(health.Max, health.Current + item.Heal);
        taken = true;
    }

    if (item.Ammo) {
        let max = WEAPONS[item.Weapon].MaxAmmo;
        if (game.Ammo[item.Weapon] < max) {
            game.Ammo[item.Weapon] = Math.min(max, game.Ammo[item.Weapon] + item.Ammo);
            taken = true;
        }
    }

    if (taken) {
        play(game, game.PlayerEye, snd_pickup);
    }

    return taken;
}

/** The player reached the exit. */
export function escape(game: Game) {
    game.State = GameState.Won;
}

let point: Vec3 = [0, 0, 0];
let other_point: Vec3 = [0, 0, 0];

/**
 * Take health off an entity and act on the result. Enemies come apart, crates
 * shatter, and anything else just gets quieter.
 */
export function damage(game: Game, entity: Entity, amount: number) {
    if ((game.World.Signature[entity] & Has.Health) === 0) {
        return;
    }

    let health = game.World.Health[entity];
    health.Current -= amount;

    if (DEBUG && health.Current > health.Max) {
        throw new Error("Health above maximum.");
    }

    if (health.Current > 0) {
        return;
    }

    if (game.World.Signature[entity] & Has.ControlAi) {
        kill_enemy(game, entity);
    } else if (game.World.Signature[entity] & Has.Shatter) {
        shatter_crate(game, entity);
    } else {
        destroy_all(game.World, entity);
    }
}

const SPLASH_QUERY = Has.Health | Has.Transform;

/** Everything with health inside a blast radius takes a share of it. */
export function splash(
    game: Game,
    centre: Vec3,
    radius: number,
    amount: number,
    neon: [number, number, number],
) {
    instantiate(game, [
        ...blueprint_burst(neon, 70, radius * 1.6, 8),
        set_position(centre[0], centre[1], centre[2]),
    ]);
    play(game, game.PlayerEye, snd_boom);
    shake_camera(game, 0.18);

    // Snapshot the list first: killing something spawns a burst, and a burst
    // spawned by this blast must not be caught in it.
    let hits: Array<Entity> = [];
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & SPLASH_QUERY) === SPLASH_QUERY) {
            hits.push(i);
        }
    }

    for (let hit of hits) {
        if (!(game.World.Signature[hit] & Has.Health)) {
            continue;
        }
        mat4_get_translation(other_point, game.World.Transform[hit].World);
        let distance = vec3_distance(centre, other_point);
        if (distance < radius) {
            let falloff = 1 - distance / radius;
            if (hit === game.PlayerEntity) {
                // Your own mortar hurts, but not as much as theirs would.
                hurt_player(game, amount * falloff * 0.4);
            } else {
                damage(game, hit, amount * falloff);
            }
        }
    }
}

/** Kills made up close drop healing pixels: the rule that pushes you forward. */
export const CLOSE_RANGE = 15;

function kill_enemy(game: Game, entity: Entity) {
    let ai = game.World.ControlAi[entity];
    mat4_get_translation(point, game.World.Transform[entity].World);

    instantiate(game, [
        ...blueprint_burst(ai.Neon, 90, 11, 7),
        set_position(point[0], point[1], point[2]),
    ]);

    mat4_get_translation(other_point, game.World.Transform[game.PlayerEntity].World);
    if (vec3_distance(point, other_point) < CLOSE_RANGE) {
        for (let i = 0; i < 4; i++) {
            let drop = instantiate(game, [
                ...blueprint_drop(ai.Neon),
                set_position(point[0], point[1] + 0.5, point[2]),
            ]);
            let body = game.World.RigidBody[drop];
            body.VelocityLinear[0] = float(-4, 4);
            body.VelocityLinear[1] = float(3, 7);
            body.VelocityLinear[2] = float(-4, 4);
        }
    }

    play(game, game.PlayerEye, snd_explode);
    destroy_all(game.World, entity);
    game.Kills++;
}

/**
 * Replace a crate with smaller pieces of itself. Generation 2 is the last one;
 * its rubble only falls and expires.
 */
function shatter_crate(game: Game, entity: Entity) {
    let generation = game.World.Shatter[entity].Generation + 1;
    let transform = game.World.Transform[entity];

    mat4_get_translation(point, transform.World);
    let scale = transform.Scale.map((n) => n * 0.42) as Vec3;
    let spread = transform.Scale.map((n) => n * 0.3) as Vec3;

    destroy_all(game.World, entity);

    for (let i = 0; i < integer(4, 5); i++) {
        let chunk = instantiate(game, [
            ...blueprint_crate(generation),
            set_position(
                point[0] + float(-spread[0], spread[0]),
                point[1] + float(-spread[1], spread[1]),
                point[2] + float(-spread[2], spread[2]),
            ),
            set_scale(scale[0], scale[1], scale[2]),
        ]);

        let body = game.World.RigidBody[chunk];
        body.Kind = RigidKind.Dynamic;
        body.VelocityLinear[0] = float(-6, 6);
        body.VelocityLinear[1] = float(2, 8);
        body.VelocityLinear[2] = float(-6, 6);
    }

    play(game, game.PlayerEye, snd_hit);
}

/** The player takes a hit. */
export function hurt_player(game: Game, amount: number) {
    if (game.State !== GameState.Playing) {
        return;
    }

    let health = game.World.Health[game.PlayerEntity];
    health.Current -= amount;
    shake_camera(game, 0.22);
    play(game, game.PlayerEntity, snd_hurt);

    if (health.Current <= 0) {
        health.Current = 0;
        game.State = GameState.Dead;
    }
}
