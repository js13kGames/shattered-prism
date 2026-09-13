import {Mat4, Vec3} from "./math.js";

export function vec3_set(out: Vec3, x: number, y: number, z: number) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
}

export function vec3_copy(out: Vec3, a: Vec3) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
}

export function vec3_add(out: Vec3, a: Vec3, b: Vec3) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
}

export function vec3_subtract(out: Vec3, a: Vec3, b: Vec3) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
}

export function vec3_scale(out: Vec3, a: Vec3, b: number) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
}

export function vec3_negate(out: Vec3, a: Vec3) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
}

export function vec3_normalize(out: Vec3, a: Vec3) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    let len = x * x + y * y + z * z;

    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
    }

    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
    return out;
}

export function vec3_dot(a: Vec3, b: Vec3) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function vec3_cross(out: Vec3, a: Vec3, b: Vec3) {
    let ax = a[0],
        ay = a[1],
        az = a[2];
    let bx = b[0],
        by = b[1],
        bz = b[2];

    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
}

export function vec3_transform_position(out: Vec3, a: Vec3, m: Mat4) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    let w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;

    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return out;
}

export function vec3_transform_direction(out: Vec3, a: Vec3, m: Mat4) {
    let x = a[0];
    let y = a[1];
    let z = a[2];

    out[0] = m[0] * x + m[4] * y + m[8] * z;
    out[1] = m[1] * x + m[5] * y + m[9] * z;
    out[2] = m[2] * x + m[6] * y + m[10] * z;
    return out;
}

export function vec3_length(a: Vec3) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    return Math.hypot(x, y, z);
}

export function vec3_distance(a: Vec3, b: Vec3) {
    let x = b[0] - a[0];
    let y = b[1] - a[1];
    let z = b[2] - a[2];
    return Math.hypot(x, y, z);
}

export function vec3_distance_squared(a: Vec3, b: Vec3) {
    let x = b[0] - a[0];
    let y = b[1] - a[1];
    let z = b[2] - a[2];
    return x * x + y * y + z * z;
}

/**
 * Extend one vector with the values of another.
 *
 * For each component, if the values are both positive or both negative, keep
 * the value farthest from zero. If the values have different signs, keep the
 * value from the first vector.
 *
 * @param out The output vector.
 * @param a The first, base vector, whose components take precedence if necessary.
 * @param b The second vector to extend with.
 */
export function vec3_extend(out: Vec3, a: Vec3, b: Vec3) {
    if (a[0] >= 0 && b[0] >= 0) {
        out[0] = Math.max(a[0], b[0]);
    } else if (a[0] <= 0 && b[0] <= 0) {
        out[0] = Math.min(a[0], b[0]);
    } else {
        out[0] = a[0];
    }

    if (a[1] <= 0 && b[1] <= 0) {
        out[1] = Math.min(a[1], b[1]);
    } else {
        // Both up, or one of each: keep the upward one. Gravity means a
        // response that lifts a body out of the floor has to win. This branch
        // used to leave out[1] alone when the signs differed, which quietly
        // made the result depend on whether the caller aliased out with a or
        // with b, and the two callers here alias different ones.
        out[1] = Math.max(a[1], b[1]);
    }

    if (a[2] >= 0 && b[2] >= 0) {
        out[2] = Math.max(a[2], b[2]);
    } else if (a[2] <= 0 && b[2] <= 0) {
        out[2] = Math.min(a[2], b[2]);
    } else {
        out[2] = a[2];
    }
}
