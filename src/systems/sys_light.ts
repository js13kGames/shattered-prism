/**
 * # sys_light
 *
 * Collect the lights the shader can see this frame.
 *
 * The forward pipeline takes eight lights, and a labyrinth has far more lamps
 * than that, so the sun goes in first and the rest of the slots go to the point
 * lights nearest the camera. Without the sort, which eight you got would depend
 * on entity order, and lamps would pop as unrelated entities were created and
 * destroyed.
 */

import {mat4_get_forward, mat4_get_translation} from "../../lib/mat4.js";
import {Vec3} from "../../lib/math.js";
import {vec3_distance_squared} from "../../lib/vec3.js";
import {Entity} from "../../lib/world.js";
import {LightKind, MAX_FORWARD_LIGHTS} from "../../materials/light.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.Transform | Has.Light;

export function sys_light(game: Game, delta: number) {
    game.LightPositions.fill(0);
    game.LightDetails.fill(0);

    let eye = game.World.Camera[game.PlayerCamera];
    if (!eye) {
        return;
    }

    let slot = 0;
    candidates.length = 0;

    for (let ent = 0; ent < game.World.Signature.length; ent++) {
        if ((game.World.Signature[ent] & QUERY) === QUERY) {
            if (game.World.Light[ent].Kind === LightKind.Directional) {
                write(game, ent, slot++);
            } else {
                mat4_get_translation(world_position, game.World.Transform[ent].World);
                candidates.push([ent, vec3_distance_squared(world_position, eye.Position)]);
            }
        }
    }

    candidates.sort(by_distance);

    for (let i = 0; i < candidates.length && slot < MAX_FORWARD_LIGHTS; i++) {
        write(game, candidates[i][0], slot++);
    }
}

let candidates: Array<[Entity, number]> = [];
let world_position: Vec3 = [0, 0, 0];

function by_distance(a: [Entity, number], b: [Entity, number]) {
    return a[1] - b[1];
}

function write(game: Game, entity: Entity, slot: number) {
    let light = game.World.Light[entity];
    let transform = game.World.Transform[entity];

    if (light.Kind === LightKind.Directional) {
        // Directional lights shine backwards, to match the way cameras work.
        // Store the light's world normal rather than its position.
        mat4_get_forward(world_position, transform.World);
    } else {
        mat4_get_translation(world_position, transform.World);
    }

    game.LightPositions[4 * slot + 0] = world_position[0];
    game.LightPositions[4 * slot + 1] = world_position[1];
    game.LightPositions[4 * slot + 2] = world_position[2];
    game.LightPositions[4 * slot + 3] = light.Kind;
    game.LightDetails[4 * slot + 0] = light.Color[0];
    game.LightDetails[4 * slot + 1] = light.Color[1];
    game.LightDetails[4 * slot + 2] = light.Color[2];
    game.LightDetails[4 * slot + 3] = light.Intensity;
}
