/**
 * # Camera
 *
 * The game has exactly one kind of camera: one that renders into the low
 * resolution scene target. In WebGL, like in OpenGL, cameras look down their
 * own -Z.
 */

import {ForwardTarget} from "../../lib/framebuffer.js";
import {mat4_create} from "../../lib/mat4.js";
import {Mat4, Vec3, Vec4} from "../../lib/math.js";
import {ProjectionPerspective} from "../../lib/projection.js";
import {GL_COLOR_BUFFER_BIT, GL_DEPTH_BUFFER_BIT} from "../../lib/webgl.js";
import {Entity} from "../../lib/world.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

export const enum CameraKind {
    Target,
}

/** The subset of camera data passed into the render pass. */
export interface CameraEye {
    Pv: Mat4;
    Position: Vec3;
    FogColor: Vec4;
    FogDistance: number;
}

export interface CameraTarget extends CameraEye {
    Kind: CameraKind.Target;
    Target: ForwardTarget;
    Projection: ProjectionPerspective;
    World: Mat4;
    ViewportWidth: number;
    ViewportHeight: number;
    ClearColor: Vec4;
    ClearMask: number;
}

export type Camera = CameraTarget;

/**
 * Add `CameraTarget` to an entity.
 *
 * @param target The render target to render into.
 * @param projection The projection to use.
 * @param clear_color Color to clear with, which is also the fog color.
 * @param fog_distance Distance at which the fog is fully opaque.
 */
export function camera_target(
    target: ForwardTarget,
    projection: ProjectionPerspective,
    clear_color: Vec4,
    fog_distance: number,
) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.Camera;
        game.World.Camera[entity] = {
            Kind: CameraKind.Target,
            Target: target,
            Projection: projection,
            World: mat4_create(),
            ViewportWidth: 0,
            ViewportHeight: 0,
            Pv: mat4_create(),
            Position: [0, 0, 0],
            FogColor: clear_color,
            FogDistance: fog_distance,
            ClearColor: clear_color,
            ClearMask: GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT,
        };
    };
}
