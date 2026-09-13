/**
 * # sys_camera
 *
 * Update the `Pv` matrix of every camera, and walk the sun along with the
 * player so that its shadow map always covers the ground under them.
 */

import {mat4_get_forward, mat4_get_translation, mat4_multiply} from "../../lib/mat4.js";
import {Vec3} from "../../lib/math.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.Transform | Has.Camera;

/** How far up the sun sits. Its ortho projection reaches further than this. */
const SUN_DISTANCE = 70;

export function sys_camera(game: Game, delta: number) {
    let sun_transform = game.World.Transform[game.Sun];
    let player_transform = game.World.Transform[game.PlayerEntity];

    if (sun_transform && player_transform) {
        mat4_get_translation(focus, player_transform.World);
        mat4_get_forward(sun_forward, sun_transform.World);

        // Snap to whole units. Without it the shadow texels drift under the
        // geometry as the player walks, and every edge crawls.
        sun_transform.Translation[0] = Math.round(focus[0] + sun_forward[0] * SUN_DISTANCE);
        sun_transform.Translation[1] = Math.round(focus[1] + sun_forward[1] * SUN_DISTANCE);
        sun_transform.Translation[2] = Math.round(focus[2] + sun_forward[2] * SUN_DISTANCE);
        game.World.Signature[game.Sun] |= Has.Dirty;
    }

    for (let ent = 0; ent < game.World.Signature.length; ent++) {
        if ((game.World.Signature[ent] & QUERY) === QUERY) {
            let camera = game.World.Camera[ent];
            let transform = game.World.Transform[ent];

            mat4_multiply(camera.Pv, camera.Projection.Projection, transform.Self);
            mat4_get_translation(camera.Position, transform.World);
        }
    }
}

let focus: Vec3 = [0, 0, 0];
let sun_forward: Vec3 = [0, 0, 0];
