/**
 * # sys_control_weapon
 *
 * Fire rebars, and shove the player the other way.
 *
 * The knockback is the whole movement system for free: aim down, fire, and the
 * recoil is a rocket jump.
 */

import {instantiate} from "../../lib/game.js";
import {Quat, Vec3} from "../../lib/math.js";
import {quat_align_y} from "../../lib/quat.js";
import {Entity} from "../../lib/world.js";
import {aim_forward, aim_origin, play, shake_camera} from "../actions.js";
import {blueprint_rebar, REBAR_SPEED} from "../blueprints/blu_effects.js";
import {copy_rotation, set_position} from "../components/com_transform.js";
import {Game} from "../game.js";
import {snd_shoot} from "../sounds.js";
import {Has} from "../world.js";

const QUERY = Has.ControlPlayer | Has.RigidBody;

const FIRE_INTERVAL = 0.28;
/** How hard the rebar shoves back. Heavy on purpose. */
const KNOCKBACK = 9;
const MUZZLE_DISTANCE = 1.1;

export function sys_control_weapon(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) === QUERY) {
            update(game, i, delta);
        }
    }
}

let aim: Vec3 = [0, 0, 0];
let origin: Vec3 = [0, 0, 0];
let rotation: Quat = [0, 0, 0, 1];

function update(game: Game, entity: Entity, delta: number) {
    let control = game.World.ControlPlayer[entity];
    if (!control.Move) {
        return;
    }

    control.Cooldown -= delta;
    if (control.Cooldown > 0 || !game.InputState["Mouse0"]) {
        return;
    }

    control.Cooldown = FIRE_INTERVAL;
    aim_forward(game, aim);
    aim_origin(game, origin);
    quat_align_y(rotation, aim);

    let rebar = instantiate(game, [
        ...blueprint_rebar(game, entity),
        set_position(
            origin[0] + aim[0] * MUZZLE_DISTANCE,
            origin[1] + aim[1] * MUZZLE_DISTANCE,
            origin[2] + aim[2] * MUZZLE_DISTANCE,
        ),
        copy_rotation(rotation),
    ]);

    let bolt = game.World.RigidBody[rebar];
    // Rebars fly flat: gravity is off for them, so aim is aim.
    bolt.VelocityLinear[0] = aim[0] * REBAR_SPEED;
    bolt.VelocityLinear[1] = aim[1] * REBAR_SPEED;
    bolt.VelocityLinear[2] = aim[2] * REBAR_SPEED;

    let body = game.World.RigidBody[entity];
    body.VelocityLinear[0] -= aim[0] * KNOCKBACK;
    body.VelocityLinear[1] -= aim[1] * KNOCKBACK;
    body.VelocityLinear[2] -= aim[2] * KNOCKBACK;

    play(game, entity, snd_shoot);
    shake_camera(game, 0.09);
}
