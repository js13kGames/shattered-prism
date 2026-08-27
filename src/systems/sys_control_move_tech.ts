/**
 * # sys_control_move_tech
 *
 * Jump, air-dash, slide, and the step-up that makes stairs walkable.
 *
 * Walking is positional (see [`sys_move`](sys_move.html)); everything here is
 * an impulse straight into the rigid body's velocity, so it stacks with the
 * walk and does not depend on the frame rate.
 */

import {Vec3} from "../../lib/math.js";
import {Entity} from "../../lib/world.js";
import {aim_forward, play, shake_camera} from "../actions.js";
import {EYE_HEIGHT, PLAYER_HALF_HEIGHT} from "../blueprints/blu_player.js";
import {DASH_CHARGES} from "../components/com_control_player.js";
import {Game} from "../game.js";
import {STEP_HEIGHT} from "../map.js";
import {snd_dash} from "../sounds.js";
import {Has} from "../world.js";

const QUERY = Has.ControlPlayer | Has.RigidBody | Has.Transform | Has.Collide;

const JUMP_SPEED = 10;
const DASH_SPEED = 27;
const SLIDE_SPEED = 21;
const SLIDE_TIME = 0.55;
/** How low the camera drops in a slide. */
const SLIDE_CROUCH = 0.45;
const GROUND_FRICTION = 9;
/** Below this, an entity has left the world. */
export const VOID_LEVEL = -6;
/** A slide is a dash you keep, so it barely rubs at all. */
const SLIDE_FRICTION = 0.6;

export function sys_control_move_tech(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) === QUERY) {
            update(game, i, delta);
        }
    }
}

let aim: Vec3 = [0, 0, 0];

function update(game: Game, entity: Entity, delta: number) {
    let control = game.World.ControlPlayer[entity];
    if (!control.Move) {
        return;
    }

    let body = game.World.RigidBody[entity];
    let transform = game.World.Transform[entity];

    // Backstop. Nothing should ever get under the floor, but if the collision
    // response ever squeezes the player out of the world, put them back rather
    // than let them fall for ever.
    if (transform.Translation[1] < VOID_LEVEL) {
        transform.Translation[1] = 3;
        body.VelocityLinear[1] = 0;
        game.World.Signature[entity] |= Has.Dirty;
    }

    step_up(game, entity, transform, body);

    if (body.IsGrounded) {
        control.Dashes = DASH_CHARGES;
    }

    if (game.InputDelta["Space"] === 1) {
        if (body.IsGrounded) {
            body.VelocityLinear[1] = JUMP_SPEED;
        } else if (control.Dashes > 0) {
            control.Dashes--;
            aim_forward(game, aim);
            body.VelocityLinear[0] = aim[0] * DASH_SPEED;
            body.VelocityLinear[1] = aim[1] * DASH_SPEED * 0.6;
            body.VelocityLinear[2] = aim[2] * DASH_SPEED;
            play(game, entity, snd_dash);
            shake_camera(game, 0.06);
        }
    }

    if (game.InputDelta["ShiftLeft"] === 1 && body.IsGrounded && control.Slide <= 0) {
        aim_forward(game, aim);
        let flat = Math.hypot(aim[0], aim[2]) || 1;
        control.Slide = SLIDE_TIME;
        body.Friction = SLIDE_FRICTION;
        body.VelocityLinear[0] = (aim[0] / flat) * SLIDE_SPEED;
        body.VelocityLinear[2] = (aim[2] / flat) * SLIDE_SPEED;
        play(game, entity, snd_dash);
    }

    if (control.Slide > 0) {
        control.Slide -= delta;
        if (control.Slide <= 0) {
            body.Friction = GROUND_FRICTION;
        }
    }

    // Ease the camera down into the slide and back up out of it.
    let eye = game.World.Transform[game.PlayerEye];
    let target = control.Slide > 0 ? EYE_HEIGHT - SLIDE_CROUCH : EYE_HEIGHT;
    if (Math.abs(eye.Translation[1] - target) > 0.001) {
        eye.Translation[1] += (target - eye.Translation[1]) * Math.min(1, delta * 16);
        game.World.Signature[game.PlayerEye] |= Has.Dirty;
    }
}

/**
 * Climb low ledges.
 *
 * Box collision alone cannot do stairs: walking into a step, the shallowest way
 * out of the box is always sideways, so the response pushes you back rather
 * than up, and you stand there scuffing your feet. So look at what was hit from
 * the side last frame, and if its top is within a step of the player's feet,
 * lift them onto it.
 */
function step_up(
    game: Game,
    entity: Entity,
    transform: Game["World"]["Transform"][0],
    body: Game["World"]["RigidBody"][0],
) {
    if (body.VelocityLinear[1] > 0.1) {
        // On the way up out of a jump; do not snap to anything.
        return;
    }

    let collisions = game.World.Collide[entity].Collisions;
    let feet = transform.Translation[1] - PLAYER_HALF_HEIGHT;
    let climb = 0;

    for (let i = 0; i < collisions.length; i++) {
        let collision = collisions[i];
        if (Math.abs(collision.Hit[1]) > 0.02) {
            // A hit from below or above is the floor or the ceiling, not a step.
            continue;
        }

        let other = game.World.Collide[collision.Other];
        if (!other) {
            continue;
        }

        let top = other.Max[1];
        if (top > feet + 0.02 && top <= feet + STEP_HEIGHT && top > climb) {
            climb = top;
        }
    }

    if (climb) {
        transform.Translation[1] = climb + PLAYER_HALF_HEIGHT + 0.02;
        if (body.VelocityLinear[1] < 0) {
            body.VelocityLinear[1] = 0;
        }
        game.World.Signature[entity] |= Has.Dirty;
    }
}
