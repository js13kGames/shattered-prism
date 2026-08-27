/**
 * # sys_pickup
 *
 * Collect the neon pixels the player runs into.
 */

import {heal_player} from "../actions.js";
import {destroy_all} from "../components/com_children.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.ControlPlayer | Has.Collide;

export function sys_pickup(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) === QUERY) {
            let collisions = game.World.Collide[i].Collisions;
            for (let j = 0; j < collisions.length; j++) {
                let other = collisions[j].Other;
                if (game.World.Signature[other] & Has.Pickup) {
                    heal_player(game, game.World.Pickup[other].Heal);
                    destroy_all(game.World, other);
                }
            }
        }
    }
}
