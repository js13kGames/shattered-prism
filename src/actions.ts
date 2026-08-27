/**
 * # Actions
 *
 * Cross-cutting game events. `dispatch` is what the UI buttons call through
 * `window.$`; the exported functions below it are what systems call, because a
 * typed free function is smaller and safer than a switch over `unknown`.
 */

import {AudioClip} from "../lib/audio.js";
import {instantiate} from "../lib/game.js";
import {Vec3} from "../lib/math.js";
import {float, integer} from "../lib/random.js";
import {vec3_distance} from "../lib/vec3.js";
import {mat4_get_forward, mat4_get_translation} from "../lib/mat4.js";
import {Entity} from "../lib/world.js";
import {blueprint_chunk} from "./blueprints/blu_arena.js";
import {blueprint_burst, blueprint_pickup} from "./blueprints/blu_effects.js";
import {destroy_all} from "./components/com_children.js";
import {RenderKind} from "./components/com_render.js";
import {RigidKind} from "./components/com_rigid_body.js";
import {set_position, set_scale} from "./components/com_transform.js";
import {Game, GameState} from "./game.js";
import {scene_arena} from "./scenes/sce_arena.js";
import {snd_explode, snd_hit, snd_hurt, snd_pickup} from "./sounds.js";
import {Has} from "./world.js";

export const enum Action {
    Start,
}

export function dispatch(game: Game, action: Action, payload: unknown) {
    switch (action) {
        case Action.Start: {
            // The AudioContext only starts from a user gesture, and this
            // action only ever runs from a click on the title screen.
            game.Audio.resume();
            scene_arena(game);
            game.State = GameState.Playing;
            break;
        }
    }
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

let point: Vec3 = [0, 0, 0];

/**
 * Take health off an entity and act on the result. Unicorns explode, props
 * shatter, and everything else just gets quieter.
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
        kill_unicorn(game, entity);
    } else if (game.World.Signature[entity] & Has.Shatter) {
        shatter_prop(game, entity);
    } else {
        destroy_all(game.World, entity);
    }
}

/**
 * A unicorn dies in a shower of its own neon. Kills made up close drop healing
 * pixels, which is the rule that pushes the player forward instead of back.
 */
function kill_unicorn(game: Game, entity: Entity) {
    let ai = game.World.ControlAi[entity];
    let transform = game.World.Transform[entity];
    mat4_get_translation(point, transform.World);

    instantiate(game, [
        ...blueprint_burst(game, ai.Neon, 90, 11, 7),
        set_position(point[0], point[1], point[2]),
    ]);

    mat4_get_translation(hit_point, game.World.Transform[game.PlayerEntity].World);
    if (vec3_distance(point, hit_point) < CLOSE_RANGE) {
        for (let i = 0; i < 5; i++) {
            let entity = instantiate(game, [
                ...blueprint_pickup(game, ai.Neon),
                set_position(point[0], point[1] + 0.5, point[2]),
            ]);
            let body = game.World.RigidBody[entity];
            body.VelocityLinear[0] = float(-4, 4);
            body.VelocityLinear[1] = float(3, 7);
            body.VelocityLinear[2] = float(-4, 4);
        }
    }

    play(game, game.PlayerEye, snd_explode);
    destroy_all(game.World, entity);
    game.Alive--;
    game.Kills++;
}

/** Kills closer than this drop healing pixels. */
export const CLOSE_RANGE = 14;

/**
 * Replace a prop with smaller pieces of itself. Generation 2 is the last one;
 * its rubble only falls and expires.
 */
function shatter_prop(game: Game, entity: Entity) {
    let generation = game.World.Shatter[entity].Generation + 1;
    let transform = game.World.Transform[entity];
    let render = game.World.Render[entity];
    let mesh = render.Kind === RenderKind.Prism ? render.Mesh : game.MeshCube;

    mat4_get_translation(point, transform.World);
    let scale: Vec3 = [
        transform.Scale[0] * 0.42,
        transform.Scale[1] * 0.42,
        transform.Scale[2] * 0.42,
    ];
    let spread: Vec3 = [
        transform.Scale[0] * 0.3,
        transform.Scale[1] * 0.3,
        transform.Scale[2] * 0.3,
    ];

    destroy_all(game.World, entity);

    for (let i = 0; i < integer(4, 5); i++) {
        let chunk = instantiate(game, [
            ...blueprint_chunk(game, mesh, generation),
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

let hit_point: Vec3 = [0, 0, 0];

/** The player takes a hit. */
export function hurt_player(game: Game, amount: number) {
    let health = game.World.Health[game.PlayerEntity];
    health.Current -= amount;
    shake_camera(game, 0.22);
    play(game, game.PlayerEntity, snd_hurt);

    if (health.Current <= 0) {
        health.Current = 0;
        game.State = GameState.Dead;
    }
}

/** The player runs into a neon pixel. */
export function heal_player(game: Game, amount: number) {
    let health = game.World.Health[game.PlayerEntity];
    health.Current = Math.min(health.Max, health.Current + amount);
    play(game, game.PlayerEye, snd_pickup);
}
