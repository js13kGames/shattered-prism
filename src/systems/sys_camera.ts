/**
 * # sys_camera
 *
 * Update the `Pv` matrix of the [camera](com_camera.html).
 */

import {mat4_copy, mat4_get_translation, mat4_multiply} from "../../lib/mat4.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.Transform | Has.Camera;

export function sys_camera(game: Game, delta: number) {
    game.Cameras = [];

    for (let ent = 0; ent < game.World.Signature.length; ent++) {
        if ((game.World.Signature[ent] & QUERY) === QUERY) {
            let camera = game.World.Camera[ent];
            let transform = game.World.Transform[ent];

            mat4_copy(camera.World, transform.World);
            mat4_multiply(camera.Pv, camera.Projection.Projection, transform.Self);
            mat4_get_translation(camera.Position, transform.World);
            game.Cameras.push(ent);
        }
    }
}
