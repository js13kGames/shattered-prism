/**
 * # sys_viewmodel
 *
 * Hold the gun in front of the camera and make it move.
 *
 * The whole illusion is three offsets added to one transform: a walk bob, a
 * recoil kick that decays, and a slow sway. The model itself is a child of the
 * camera, so it inherits the view for free.
 */

import {Vec3} from "../../lib/math.js";
import {quat_from_euler} from "../../lib/quat.js";
import {Game, GameState} from "../game.js";
import {Has} from "../world.js";

/** Where the gun rests, in camera space. */
const REST: Vec3 = [0.26, -0.23, -0.55];
/** How fast the recoil settles. */
const RECOIL_DECAY = 6.5;
const BOB_SPEED = 11;

export function sys_viewmodel(game: Game, delta: number) {
    let transform = game.World.Transform[game.Viewmodel];
    let body = game.World.RigidBody[game.PlayerEntity];
    if (!transform || !body) {
        return;
    }

    game.Recoil = Math.max(0, game.Recoil - RECOIL_DECAY * delta);

    // Bob only while actually walking on the ground.
    let speed = Math.hypot(body.VelocityLinear[0], body.VelocityLinear[2]);
    let walking = body.IsGrounded && (game.Walking || speed > 1);
    game.Bob += delta * (walking ? BOB_SPEED : 0);

    let bob_x = Math.sin(game.Bob) * 0.035;
    let bob_y = Math.abs(Math.cos(game.Bob)) * -0.03;
    // A slow idle sway, so the gun is never perfectly still.
    let sway = Math.sin(game.Now / 1400) * 0.012;

    transform.Translation[0] = REST[0] + bob_x + sway;
    transform.Translation[1] = REST[1] + bob_y - game.Recoil * 0.045;
    transform.Translation[2] = REST[2] + game.Recoil * 0.22;

    // Kick the muzzle up as it fires, and drop it slightly while falling.
    let fall = game.State === GameState.Playing ? body.VelocityLinear[1] * 0.4 : 0;
    quat_from_euler(transform.Rotation, game.Recoil * 9 - fall, 0, -game.Recoil * 3);

    game.World.Signature[game.Viewmodel] |= Has.Dirty;
}
