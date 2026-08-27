/**
 * # sys_platform
 *
 * Lifts. A lift rises when the player stands near it, waits at the top, and
 * comes back down.
 *
 * The platform's collider is flagged dynamic so that sys_collide recomputes its
 * box every frame, but its body is kinematic, so nothing it carries can push it
 * off course. The player is carried by the collision response itself: the box
 * moves up into them, and they are pushed out of the top of it.
 */

import {mat4_get_translation} from "../../lib/mat4.js";
import {Vec3} from "../../lib/math.js";
import {vec3_distance_squared} from "../../lib/vec3.js";
import {Entity} from "../../lib/world.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.Platform | Has.Transform | Has.RigidBody;

/** How close the player has to be to call the lift. */
const CALL_RANGE = 5;
/** How long it holds at the top before returning. */
const HOLD = 2.5;

export function sys_platform(game: Game, delta: number) {
    mat4_get_translation(player, game.World.Transform[game.PlayerEntity].World);

    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) === QUERY) {
            update(game, i, delta);
        }
    }
}

let player: Vec3 = [0, 0, 0];
let here: Vec3 = [0, 0, 0];

function update(game: Game, entity: Entity, delta: number) {
    let platform = game.World.Platform[entity];
    let transform = game.World.Transform[entity];
    let body = game.World.RigidBody[entity];

    mat4_get_translation(here, transform.World);
    let called = vec3_distance_squared(here, player) < CALL_RANGE * CALL_RANGE;

    if (platform.TargetY === platform.LowY) {
        if (called) {
            platform.TargetY = platform.HighY;
        }
    } else if (transform.Translation[1] >= platform.HighY - 0.01) {
        platform.Wait -= delta;
        if (platform.Wait <= 0 && !called) {
            platform.TargetY = platform.LowY;
        }
    }

    let gap = platform.TargetY - transform.Translation[1];
    let travel = Math.sign(gap) * Math.min(Math.abs(gap), platform.Speed * delta);

    if (travel) {
        transform.Translation[1] += travel;
        game.World.Signature[entity] |= Has.Dirty;
    } else if (platform.TargetY === platform.HighY) {
        platform.Wait = HOLD;
    }

    // Other bodies read this when they resolve against the lift.
    body.VelocityLinear[1] = travel / delta;
}
