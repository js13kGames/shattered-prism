/**
 * # ControlPlayer
 *
 * Make the entity controllable by the player. The player is one entity with a
 * camera child, so the movement-tech state (dash charges, slide) lives here
 * rather than in a component of its own.
 */

import {Entity} from "../../lib/world.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

export interface ControlPlayer {
    Move: boolean;
    Yaw: number;
    Pitch: number;
    MinPitch: number;
    MaxPitch: number;
    /** Air-dashes left before touching the ground again. */
    Dashes: number;
    /** Time until the next shot. */
    Cooldown: number;
    /** Time left in the current slide. */
    Slide: number;
}

/**
 * Add `ControlPlayer` to an entity.
 *
 * @param move Whether to control the entity's movement.
 * @param yaw Sensitivity of the yaw control, in degrees per pixel.
 * @param pitch Sensitivity of the pitch control, in degrees per pixel.
 * @param min_pitch Min pitch allowed, in arc degrees.
 * @param max_pitch Max pitch allowed, in arc degrees.
 */
export function control_player(
    move: boolean,
    yaw: number,
    pitch: number,
    min_pitch = 0,
    max_pitch = 0,
) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.ControlPlayer;
        game.World.ControlPlayer[entity] = {
            Move: move,
            Yaw: yaw,
            Pitch: pitch,
            MinPitch: min_pitch,
            MaxPitch: max_pitch,
            Dashes: DASH_CHARGES,
            Cooldown: 0,
            Slide: 0,
        };
    };
}

export const DASH_CHARGES = 2;
