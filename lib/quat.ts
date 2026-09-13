import {DEG_TO_RAD, Quat, RAD_TO_DEG, Vec3} from "./math.js";
import {clamp} from "./number.js";
import {vec3_cross, vec3_normalize} from "./vec3.js";

export function quat_copy(out: Quat, a: Quat) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
}

export function quat_multiply(out: Quat, a: Quat, b: Quat) {
    let ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3];
    let bx = b[0],
        by = b[1],
        bz = b[2],
        bw = b[3];

    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
}

/**
 * Compute a quaternion out of three Euler angles given in degrees. The order of rotation is YXZ.
 * @param out Quaternion to write to.
 * @param x Rotation about the X axis, in degrees.
 * @param y Rotation around the Y axis, in degress.
 * @param z Rotation around the Z axis, in degress.
 */
export function quat_from_euler(out: Quat, x: number, y: number, z: number) {
    let sx = Math.sin((x / 2) * DEG_TO_RAD);
    let cx = Math.cos((x / 2) * DEG_TO_RAD);
    let sy = Math.sin((y / 2) * DEG_TO_RAD);
    let cy = Math.cos((y / 2) * DEG_TO_RAD);
    let sz = Math.sin((z / 2) * DEG_TO_RAD);
    let cz = Math.cos((z / 2) * DEG_TO_RAD);

    out[0] = sx * cy * cz + cx * sy * sz;
    out[1] = cx * sy * cz - sx * cy * sz;
    out[2] = cx * cy * sz - sx * sy * cz;
    out[3] = cx * cy * cz + sx * sy * sz;
    return out;
}

/**
 * Get the pitch (rotation around the X axis) of a quaternion, in arc degrees.
 * @param quat Quaternion to decompose.
 */
export function quat_get_pitch(quat: Quat) {
    let x = quat[0];
    let y = quat[1];
    let z = quat[2];
    let w = quat[3];

    let m23 = 2 * (y * z - w * x);
    return Math.asin(-clamp(-1, 1, m23)) * RAD_TO_DEG;
}

/**
 * Compute a quaternion from an axis and an angle of rotation around the axis.
 * @param out Quaternion to write to.
 * @param axis Axis of rotation.
 * @param angle Rotation in radians.
 */
export function quat_from_axis(out: Quat, axis: Vec3, angle: number) {
    let half = angle / 2;
    out[0] = Math.sin(half) * axis[0];
    out[1] = Math.sin(half) * axis[1];
    out[2] = Math.sin(half) * axis[2];
    out[3] = Math.cos(half);
    return out;
}

const UP: Vec3 = [0, 1, 0];
const align_axis: Vec3 = [0, 0, 0];

/**
 * Build the rotation that takes the +Y axis onto `direction`.
 *
 * Every cylinder in Goodluck stands on its own Y axis, so this is what points
 * one at something. `direction` must be a unit vector.
 */
export function quat_align_y(out: Quat, direction: Vec3) {
    vec3_cross(align_axis, UP, direction);
    let sin = Math.hypot(align_axis[0], align_axis[1], align_axis[2]);
    if (sin < 1e-6) {
        // Straight up or straight down: the cross product carries no axis.
        return quat_from_axis(out, [1, 0, 0], direction[1] > 0 ? 0 : Math.PI);
    }
    vec3_normalize(align_axis, align_axis);
    return quat_from_axis(out, align_axis, Math.atan2(sin, direction[1]));
}
