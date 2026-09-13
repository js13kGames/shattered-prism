import {mat4_get_translation} from "./mat4.js";
import {Mat4, Vec3} from "./math.js";
import {vec3_add, vec3_subtract} from "./vec3.js";

export interface AABB {
    /** The size of the collider in self units. */
    Size: [x: number, y: number, z: number];
    /** The min corner of the AABB. */
    Min: Vec3;
    /** The max corner of the AABB. */
    Max: Vec3;
    /** The world position of the AABB. */
    Center: Vec3;
    /** The half-extents of the AABB on the three axes. */
    Half: [x: number, y: number, z: number];
}

/**
 * Compute the world AABB of the collider's box, rotated, scaled and moved by
 * the transform.
 *
 * The half-extent on each world axis is the sum of the box's scaled axes
 * projected onto it, which is the absolute value of the matrix applied to the
 * half size. It gives exactly the same box as transforming the eight corners.
 */
export function compute_aabb(world: Mat4, aabb: AABB) {
    mat4_get_translation(aabb.Center, world);

    for (let i = 0; i < 3; i++) {
        aabb.Half[i] =
            (Math.abs(world[i]) * aabb.Size[0] +
                Math.abs(world[4 + i]) * aabb.Size[1] +
                Math.abs(world[8 + i]) * aabb.Size[2]) /
            2;
    }

    aabb.Min = vec3_subtract([0, 0, 0], aabb.Center, aabb.Half);
    aabb.Max = vec3_add([0, 0, 0], aabb.Center, aabb.Half);
}

export function penetrate_aabb(a: AABB, b: AABB): Vec3 {
    let distance_x = a.Center[0] - b.Center[0];
    let penetration_x = a.Half[0] + b.Half[0] - Math.abs(distance_x);

    let distance_y = a.Center[1] - b.Center[1];
    let penetration_y = a.Half[1] + b.Half[1] - Math.abs(distance_y);

    let distance_z = a.Center[2] - b.Center[2];
    let penetration_z = a.Half[2] + b.Half[2] - Math.abs(distance_z);

    if (penetration_x < penetration_y && penetration_x < penetration_z) {
        return [penetration_x * Math.sign(distance_x), 0, 0];
    } else if (penetration_y < penetration_z) {
        return [0, penetration_y * Math.sign(distance_y), 0];
    } else {
        return [0, 0, penetration_z * Math.sign(distance_z)];
    }
}

export function intersect_aabb(a: AABB, b: AABB) {
    return (
        a.Min[0] < b.Max[0] &&
        a.Max[0] > b.Min[0] &&
        a.Min[1] < b.Max[1] &&
        a.Max[1] > b.Min[1] &&
        a.Min[2] < b.Max[2] &&
        a.Max[2] > b.Min[2]
    );
}

/**
 * Slab test of a ray against an AABB.
 *
 * `inverse` is the componentwise reciprocal of the ray direction, computed once
 * by the caller because a line-of-sight check tests one ray against hundreds of
 * boxes. Returns the distance along the ray to the entry point, or -1 for a
 * miss. A ray that starts inside the box returns 0.
 */
export function ray_aabb(origin: Vec3, inverse: Vec3, aabb: AABB) {
    let near = -Infinity;
    let far = Infinity;

    for (let axis = 0; axis < 3; axis++) {
        let t1 = (aabb.Min[axis] - origin[axis]) * inverse[axis];
        let t2 = (aabb.Max[axis] - origin[axis]) * inverse[axis];
        if (t1 > t2) {
            let swap = t1;
            t1 = t2;
            t2 = swap;
        }
        if (t1 > near) {
            near = t1;
        }
        if (t2 < far) {
            far = t2;
        }
        if (near > far) {
            return -1;
        }
    }

    if (far < 0) {
        return -1;
    }

    return near < 0 ? 0 : near;
}
