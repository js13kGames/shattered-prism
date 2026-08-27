/**
 * # sys_resize
 *
 * Match the canvas to the window and keep the player's projection square.
 *
 * The scene target stays 320x240 whatever the window does; only the projection
 * follows the window aspect, so the upscaled pixels get wider on a wide screen
 * instead of the world getting stretched. The sun's orthographic projection
 * never changes.
 */

import {mat4_from_perspective, mat4_invert} from "../../lib/mat4.js";
import {ProjectionKind} from "../../lib/projection.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.Camera;

export function sys_resize(game: Game, delta: number) {
    if (game.ViewportWidth != window.innerWidth || game.ViewportHeight != window.innerHeight) {
        game.ViewportResized = true;
    }

    if (!game.ViewportResized) {
        return;
    }

    game.ViewportWidth = game.SceneCanvas.width = window.innerWidth;
    game.ViewportHeight = game.SceneCanvas.height = window.innerHeight;
    let aspect = game.ViewportWidth / game.ViewportHeight;

    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) === QUERY) {
            let projection = game.World.Camera[i].Projection;
            if (projection.Kind === ProjectionKind.Perspective) {
                mat4_from_perspective(
                    projection.Projection,
                    aspect < 1 ? projection.FovY / aspect : projection.FovY,
                    aspect,
                    projection.Near,
                    projection.Far,
                );
                mat4_invert(projection.Inverse, projection.Projection);
            }
        }
    }
}
