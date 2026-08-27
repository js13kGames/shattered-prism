import {perspective} from "../../lib/projection.js";
import {audio_listener} from "../components/com_audio_listener.js";
import {audio_source} from "../components/com_audio_source.js";
import {camera_target} from "../components/com_camera.js";
import {children} from "../components/com_children.js";
import {collide} from "../components/com_collide.js";
import {control_player} from "../components/com_control_player.js";
import {health} from "../components/com_gameplay.js";
import {move} from "../components/com_move.js";
import {RigidKind, rigid_body} from "../components/com_rigid_body.js";
import {shake} from "../components/com_shake.js";
import {transform} from "../components/com_transform.js";
import {Game, Layer} from "../game.js";

export const PLAYER_HEALTH = 100;
export const EYE_HEIGHT = 0.7;

/** Near-black, so that only the neon carries colour. */
export const CLEAR_COLOR: [number, number, number, number] = [0.02, 0.02, 0.03, 1];
export const FOG_DISTANCE = 55;

/**
 * The player is a yaw rig with a pitch child; the camera hangs off the pitch
 * child, turned around, because cameras look down their own -Z.
 *
 * Children[0] of the root is the eye. The scene stores it on the game as
 * `PlayerEye`: it is both the aim direction and the muzzle.
 */
export function blueprint_player(game: Game) {
    return [
        transform(),
        control_player(true, 0.15, 0),
        move(9, 0),
        collide(true, Layer.Player, Layer.Terrain | Layer.Enemy | Layer.Pickup, [0.8, 1.8, 0.8]),
        rigid_body(RigidKind.Dynamic, 0),
        health(PLAYER_HEALTH),
        audio_source(false),
        audio_listener(),
        children([
            transform([0, EYE_HEIGHT, 0]),
            control_player(false, 0, 0.15, -85, 85),
            move(0, 0),
            children([
                transform(undefined, [0, 1, 0, 0]),
                shake(0),
                camera_target(
                    game.Targets.Scene,
                    perspective(1.2, 0.1, 250),
                    CLEAR_COLOR,
                    FOG_DISTANCE,
                ),
            ]),
        ]),
    ];
}
