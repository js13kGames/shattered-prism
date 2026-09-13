/**
 * # sys_move
 *
 * Walk entities. Only entities without a parent walk, so the direction is
 * transformed straight into the world space.
 */

import {
    vec3_add,
    vec3_normalize,
    vec3_scale,
    vec3_set,
    vec3_transform_direction,
} from "../../lib/vec3.js";
import {Entity} from "../../lib/world.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.Transform | Has.Move;

export function sys_move(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) === QUERY) {
            update(game, i, delta);
        }
    }
}

function update(game: Game, entity: Entity, delta: number) {
    let transform = game.World.Transform[entity];
    let move = game.World.Move[entity];

    if (move.Direction[0] !== 0 || move.Direction[1] !== 0 || move.Direction[2] !== 0) {
        // Directions are not normalized to allow them to express slower
        // movement from a gamepad input. They can also cancel each other out.
        // They may not, however, intensify one another; hence max amount is 1.
        let amount = Math.min(1, Math.hypot(...move.Direction));
        // Transform the direction into the world space. This will also scale
        // the result by the scale encoded in the transform.
        vec3_transform_direction(move.Direction, move.Direction, transform.World);
        // Normalize the direction to remove the transform's scale. The length
        // of the orignal direction is now lost.
        vec3_normalize(move.Direction, move.Direction);
        // Scale by the amount and distance traveled in this tick.
        vec3_scale(move.Direction, move.Direction, amount * move.MoveSpeed * delta);
        vec3_add(transform.Translation, transform.Translation, move.Direction);
        game.World.Signature[entity] |= Has.Dirty;
        vec3_set(move.Direction, 0, 0, 0);
    }
}
