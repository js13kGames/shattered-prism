import {mat4_create, mat4_from_ortho} from "./mat4.js";
import {Mat4} from "./math.js";

export type Projection = ProjectionPerspective | ProjectionOrthographic;

export const enum ProjectionKind {
    Perspective,
    Orthographic,
}

export interface ProjectionPerspective {
    Kind: ProjectionKind.Perspective;
    FovY: number;
    Near: number;
    Far: number;
    Projection: Mat4;
}

/**
 * Create a perspective projection. sys_resize computes the matrix, because it
 * depends on the aspect of the window.
 *
 * @param fov_y The vertical field of view.
 * @param near The near clipping plane.
 * @param far The far clipping plane.
 */
export function perspective(fov_y: number, near: number, far: number): ProjectionPerspective {
    return {
        Kind: ProjectionKind.Perspective,
        FovY: fov_y,
        Near: near,
        Far: far,
        Projection: mat4_create(),
    };
}

export interface ProjectionOrthographic {
    Kind: ProjectionKind.Orthographic;
    Projection: Mat4;
}

/**
 * Create a square orthographic projection. It never changes.
 *
 * @param radius Half of the width and of the height of the projection.
 * @param near The near clipping plane.
 * @param far The far clipping plane.
 */
export function orthographic(radius: number, near: number, far: number): ProjectionOrthographic {
    return {
        Kind: ProjectionKind.Orthographic,
        Projection: mat4_from_ortho(mat4_create(), radius, radius, -radius, -radius, near, far),
    };
}
