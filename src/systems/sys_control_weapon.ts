/**
 * # sys_control_weapon
 *
 * Fire, switch weapons, and shove the player the other way.
 *
 * The knockback is a movement system for free: aim down, fire the mortar, and
 * the recoil is a rocket jump.
 */

import {instantiate} from "../../lib/game.js";
import {Quat, Vec3} from "../../lib/math.js";
import {quat_align_y} from "../../lib/quat.js";
import {float} from "../../lib/random.js";
import {vec3_normalize} from "../../lib/vec3.js";
import {Entity} from "../../lib/world.js";
import {aim_forward, aim_origin, play, shake_camera, switch_weapon} from "../actions.js";
import {blueprint_shot} from "../blueprints/blu_effects.js";
import {copy_rotation, set_position} from "../components/com_transform.js";
import {Game} from "../game.js";
import {snd_dry, snd_mortar, snd_shoot, snd_shred} from "../sounds.js";
import {WEAPONS} from "../weapons.js";
import {Has} from "../world.js";

const QUERY = Has.ControlPlayer | Has.RigidBody;
const MUZZLE_DISTANCE = 1.2;
const FIRE_SOUNDS = [snd_shoot, snd_shred, snd_mortar];

export function sys_control_weapon(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) === QUERY) {
            update(game, i, delta);
        }
    }
}

let aim: Vec3 = [0, 0, 0];
let spread: Vec3 = [0, 0, 0];
let origin: Vec3 = [0, 0, 0];
let rotation: Quat = [0, 0, 0, 1];

function update(game: Game, entity: Entity, delta: number) {
    let control = game.World.ControlPlayer[entity];
    if (!control.Move) {
        return;
    }

    control.Cooldown -= delta;

    // Number keys pick a weapon; the wheel steps through them.
    for (let slot = 0; slot < WEAPONS.length; slot++) {
        if (game.InputDelta["Digit" + (slot + 1)] === 1) {
            switch_weapon(game, slot);
        }
    }
    if (game.InputDelta["WheelY"]) {
        switch_weapon(
            game,
            (game.Weapon + (game.InputDelta["WheelY"] > 0 ? 1 : WEAPONS.length - 1)) %
                WEAPONS.length,
        );
    }

    if (control.Cooldown > 0 || !game.InputState["Mouse0"]) {
        return;
    }

    let weapon = WEAPONS[game.Weapon];

    if (weapon.Cost && game.Ammo[game.Weapon] < weapon.Cost) {
        // Out of ammo: click, and do not try again until the trigger is
        // released, so an empty gun does not chatter.
        control.Cooldown = 0.4;
        play(game, entity, snd_dry);
        return;
    }

    control.Cooldown = weapon.Interval;
    game.Ammo[game.Weapon] -= weapon.Cost;
    game.Recoil = 1;

    aim_forward(game, aim);
    aim_origin(game, origin);

    for (let i = 0; i < weapon.Count; i++) {
        spread[0] = aim[0] + float(-weapon.Spread, weapon.Spread);
        spread[1] = aim[1] + float(-weapon.Spread, weapon.Spread);
        spread[2] = aim[2] + float(-weapon.Spread, weapon.Spread);
        vec3_normalize(spread, spread);
        quat_align_y(rotation, spread);

        let shot = instantiate(game, [
            ...blueprint_shot(weapon, entity),
            set_position(
                origin[0] + aim[0] * MUZZLE_DISTANCE,
                origin[1] + aim[1] * MUZZLE_DISTANCE,
                origin[2] + aim[2] * MUZZLE_DISTANCE,
            ),
            copy_rotation(rotation),
        ]);

        let bolt = game.World.RigidBody[shot];
        bolt.VelocityLinear[0] = spread[0] * weapon.Speed;
        bolt.VelocityLinear[1] = spread[1] * weapon.Speed;
        bolt.VelocityLinear[2] = spread[2] * weapon.Speed;
    }

    let body = game.World.RigidBody[entity];
    body.VelocityLinear[0] -= aim[0] * weapon.Knockback;
    body.VelocityLinear[1] -= aim[1] * weapon.Knockback;
    body.VelocityLinear[2] -= aim[2] * weapon.Knockback;

    play(game, entity, FIRE_SOUNDS[game.Weapon] || snd_shoot);
    shake_camera(game, weapon.Shake);
}
