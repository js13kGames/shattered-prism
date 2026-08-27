/**
 * # sys_control_keyboard
 *
 * Turn WASD into a movement direction in the entity's own space. Looking is
 * mouse-only, so there is nothing here for the arrow keys.
 */

import {Entity} from "../../lib/world.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.Move | Has.ControlPlayer;

export function sys_control_keyboard(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) === QUERY) {
            update(game, i);
        }
    }
}

function update(game: Game, entity: Entity) {
    if (!game.World.ControlPlayer[entity].Move) {
        return;
    }

    let move = game.World.Move[entity];
    if (game.InputState["KeyW"]) {
        move.Direction[2] += 1;
    }
    if (game.InputState["KeyS"]) {
        move.Direction[2] -= 1;
    }
    if (game.InputState["KeyA"]) {
        move.Direction[0] += 1;
    }
    if (game.InputState["KeyD"]) {
        move.Direction[0] -= 1;
    }
}
