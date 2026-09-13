/**
 * # Light
 *
 * The `Light` component allows an entity to emit light.
 */

import {Vec3} from "../../lib/math.js";
import {Entity} from "../../lib/world.js";
import {LightKind} from "../../materials/light.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

export interface Light {
    Kind: LightKind;
    Color: Vec3;
    Intensity: number;
}

/**
 * Add `Light` to an entity.
 *
 * A directional light ignores the position of the entity. It shines _the
 * opposite_ of the forward vector of the entity's transform, for consistency
 * with the way cameras look at the scene. A point light shines from the
 * position of the entity.
 *
 * @param kind Directional or point.
 * @param color The color of the light.
 * @param intensity The intensity of the light, multiplied by the color.
 */
export function light(kind: LightKind, color: Vec3, intensity: number) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.Light;
        game.World.Light[entity] = {
            Kind: kind,
            Color: color,
            Intensity: intensity,
        };
    };
}
