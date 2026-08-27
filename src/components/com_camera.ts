/**
 * # Camera
 *
 * Two cameras run every frame: the player's, which renders the scene into the
 * low-resolution colour target, and the sun's, which renders the level's depth
 * into the shadow map. In WebGL, like in OpenGL, cameras look down their own -Z.
 */

import {DepthTarget, ForwardTarget} from "../../lib/framebuffer.js";
import {mat4_create} from "../../lib/mat4.js";
import {Mat4, Vec3, Vec4} from "../../lib/math.js";
import {Projection} from "../../lib/projection.js";
import {GL_COLOR_BUFFER_BIT, GL_DEPTH_BUFFER_BIT} from "../../lib/webgl.js";
import {Entity} from "../../lib/world.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

/** The subset of camera data passed into a render pass. */
export interface CameraEye {
    Pv: Mat4;
    Position: Vec3;
    FogColor: Vec4;
    FogDistance: number;
}

export interface Camera extends CameraEye {
    Target: ForwardTarget | DepthTarget;
    Projection: Projection;
    World: Mat4;
    ClearColor: Vec4;
}

/**
 * Add a camera that renders into a target.
 *
 * @param target The colour or depth target to render into.
 * @param projection Perspective for the player, orthographic for the sun.
 * @param clear_color Colour to clear with, which is also the fog colour.
 * @param fog_distance Distance at which the fog is fully opaque.
 */
export function camera_target(
    target: ForwardTarget | DepthTarget,
    projection: Projection,
    clear_color: Vec4 = [0, 0, 0, 1],
    fog_distance = 100,
) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.Camera;
        game.World.Camera[entity] = {
            Target: target,
            Projection: projection,
            World: mat4_create(),
            Pv: mat4_create(),
            Position: [0, 0, 0],
            FogColor: clear_color,
            FogDistance: fog_distance,
            ClearColor: clear_color,
        };
    };
}

export const CLEAR_MASK = GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT;
