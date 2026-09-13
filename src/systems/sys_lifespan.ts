/**
 * # sys_lifespan
 *
 * Autodestruct entities after a given time.
 */

import {destroy_all} from "../components/com_children.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.Lifespan;

export function sys_lifespan(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) == QUERY) {
            let lifespan = game.World.Lifespan[i];
            lifespan.Remaining -= delta;
            if (lifespan.Remaining < 0) {
                destroy_all(game.World, i);
            }
        }
    }
}
