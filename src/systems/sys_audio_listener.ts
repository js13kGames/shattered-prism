/**
 * # sys_audio_listener
 *
 * Update the position and orientation of `game.Audio`'s listener.
 */

import {mat4_get_forward, mat4_get_translation, mat4_get_up} from "../../lib/mat4.js";
import {Vec3} from "../../lib/math.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.AudioListener | Has.Transform;

let position: Vec3 = [0, 0, 0];
let forward: Vec3 = [0, 0, 0];
let up: Vec3 = [0, 0, 0];

export function sys_audio_listener(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) === QUERY) {
            let world = game.World.Transform[i].World;
            // The older setters work in every browser. Firefox does not have
            // the AudioParam version of the listener.
            game.Audio.listener.setPosition(...mat4_get_translation(position, world));
            game.Audio.listener.setOrientation(
                ...mat4_get_forward(forward, world),
                ...mat4_get_up(up, world),
            );
        }
    }
}
