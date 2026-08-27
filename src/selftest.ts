/**
 * # Self-check
 *
 * Run it with `npm run selftest`. Nothing imports this file, so it costs the
 * game zero bytes.
 *
 * It covers the two pieces of maths in the project that are neither obvious nor
 * visible when they go wrong: the rotation that points a cylinder at something,
 * and the vector merge that combines several collision responses into one. Both
 * fail silently and look like a physics mood rather than a bug.
 */

import {Quat, Vec3} from "../lib/math.js";
import {quat_align_y} from "../lib/quat.js";
import {vec3_extend, vec3_normalize} from "../lib/vec3.js";

let failures = 0;

function check(name: string, condition: boolean, detail = "") {
    if (!condition) {
        failures++;
        console.error(`FAIL ${name} ${detail}`);
    }
}

function close(a: number, b: number) {
    return Math.abs(a - b) < 1e-5;
}

/** Rotate a vector by a quaternion, independently of the code under test. */
function rotate(out: Vec3, q: Quat, v: Vec3) {
    let [x, y, z, w] = q;
    // t = 2 * (q.xyz x v)
    let tx = 2 * (y * v[2] - z * v[1]);
    let ty = 2 * (z * v[0] - x * v[2]);
    let tz = 2 * (x * v[1] - y * v[0]);
    out[0] = v[0] + w * tx + (y * tz - z * ty);
    out[1] = v[1] + w * ty + (z * tx - x * tz);
    out[2] = v[2] + w * tz + (x * ty - y * tx);
    return out;
}

// quat_align_y must map +Y onto the direction it is given, including the two
// poles, where the cross product it is built from degenerates to zero.
{
    let directions: Array<Vec3> = [
        [0, 1, 0],
        [0, -1, 0],
        [1, 0, 0],
        [0, 0, 1],
        [0, 0, -1],
        [0.6, 0.8, 0],
        [-0.3, -0.5, 0.81],
        [0.577, 0.577, 0.577],
    ];

    let q: Quat = [0, 0, 0, 1];
    let got: Vec3 = [0, 0, 0];

    for (let direction of directions) {
        vec3_normalize(direction, direction);
        quat_align_y(q, direction);
        rotate(got, q, [0, 1, 0]);
        check(
            "quat_align_y",
            close(got[0], direction[0]) && close(got[1], direction[1]) && close(got[2], direction[2]),
            `for ${direction} got ${got.map((n) => n.toFixed(3))}`,
        );
        check(
            "quat_align_y unit",
            close(Math.hypot(q[0], q[1], q[2], q[3]), 1),
            `for ${direction}`,
        );
    }
}

// vec3_extend keeps the value farthest from zero when the signs agree, and the
// first vector's value when they do not. Each axis is checked separately: the
// version this replaced tested the X components inside the Z branch, so Z
// silently took the wrong value for mixed signs.
{
    let out: Vec3 = [0, 0, 0];

    vec3_extend(out, [1, 2, 3], [4, 5, 6]);
    check("vec3_extend both positive", `${out}` === "4,5,6", `${out}`);

    vec3_extend(out, [-1, -2, -3], [-4, -5, -6]);
    check("vec3_extend both negative", `${out}` === "-4,-5,-6", `${out}`);

    // Mixed signs on every axis at once: a wins on X and Z, and on Y only when
    // it is the one pushing up.
    vec3_extend(out, [2, 2, 2], [-9, -9, -9]);
    check("vec3_extend mixed, a positive", `${out}` === "2,2,2", `${out}`);

    vec3_extend(out, [-2, -2, -2], [9, 9, 9]);
    check("vec3_extend mixed, a negative", out[0] === -2 && out[2] === -2, `${out}`);

    // Gravity rule: with different signs on Y, an upward push from b is kept
    // rather than a downward one from a.
    vec3_extend(out, [0, -2, 0], [0, 9, 0]);
    check("vec3_extend keeps the upward response", out[1] === 9, `${out}`);
}

// Throwing is how this exits non-zero; naming `process` would mean adding node
// types to the project for one line.
if (failures) {
    throw new Error(`${failures} check(s) failed.`);
}

console.log("All checks passed.");
