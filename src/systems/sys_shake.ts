/**
 * # sys_shake
 *
 * Shake entities randomly, and let the shake die down on its own.
 *
 * Use it only on a child whose resting position is [0, 0, 0]; the system
 * overwrites the translation outright.
 */

import {Entity} from "../../lib/world.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.Transform | Has.Shake;
/** How fast a kick decays, in radius units per second. */
const DECAY = 1.2;

export function sys_shake(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) == QUERY) {
            update(game, i, delta);
        }
    }
}

function update(game: Game, entity: Entity, delta: number) {
    let shake = game.World.Shake[entity];
    if (shake.Radius <= 0) {
        return;
    }

    shake.Radius = Math.max(0, shake.Radius - DECAY * delta);

    let transform = game.World.Transform[entity];
    transform.Translation[0] = (Math.random() - 0.5) * shake.Radius * 2;
    transform.Translation[1] = (Math.random() - 0.5) * shake.Radius * 2;
    transform.Translation[2] = (Math.random() - 0.5) * shake.Radius * 2;
    game.World.Signature[entity] |= Has.Dirty;
}
