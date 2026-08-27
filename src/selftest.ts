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
import {
    AMMO,
    build_grid,
    cell_level,
    CRATES,
    EXIT,
    GRID_W,
    LIFTS,
    MEDKITS,
    PADS,
    PILLARS,
    reachable,
    SOLID,
    SPAWNS,
    START,
} from "./map.js";

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

// The level has to be finishable, and everything placed in it has to be
// standing on a floor. Neither is visible from a screenshot, and both are easy
// to break with one wrong number in the map data.
{
    let grid = build_grid();
    let seen = reachable(grid);
    let index = (cell: [number, number]) => cell[1] * GRID_W + cell[0];

    check("start is a floor", cell_level(grid, START[0], START[1]) !== SOLID);
    check("exit is a floor", cell_level(grid, EXIT[0], EXIT[1]) !== SOLID);
    check("exit is reachable", seen.has(index(EXIT)));

    let solid = (name: string, cells: Array<Array<number>>) => {
        for (let cell of cells) {
            let [x, z] = cell;
            check(`${name} stands on a floor`, cell_level(grid, x, z) !== SOLID, `at ${x},${z}`);
        }
    };

    solid("crate", CRATES);
    solid("pillar", PILLARS);
    solid("ammo", AMMO);
    solid("medkit", MEDKITS);
    solid("lift", LIFTS);
    solid("pad", PADS);

    for (let spawn of SPAWNS) {
        for (let node of spawn.Route) {
            check(
                "patrol node is a floor",
                cell_level(grid, node[0], node[1]) !== SOLID,
                `at ${node}`,
            );
            check("patrol node is reachable", seen.has(index(node)), `at ${node}`);
        }
    }

    // Pillars and crates are solid, and the AI cannot path around them.
    let obstacles = new Set(
        [...PILLARS, ...CRATES].map((cell) => cell[1] * GRID_W + cell[0]),
    );
    let blocked = (a: Array<number>, b: Array<number>) => {
        let span = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
        for (let s = 0; s <= span * 2; s++) {
            let t = span ? s / (span * 2) : 0;
            let x = Math.round(a[0] + (b[0] - a[0]) * t);
            let z = Math.round(a[1] + (b[1] - a[1]) * t);
            if (obstacles.has(z * GRID_W + x)) {
                return true;
            }
        }
        return false;
    };

    for (let spawn of SPAWNS) {
        check(
            "spawn is clear of obstacles",
            !obstacles.has(spawn.Route[0][1] * GRID_W + spawn.Route[0][0]),
            `at ${spawn.Route[0]}`,
        );
    }

    // The AI has no pathfinding: it walks the straight line between route
    // nodes. So every cell on that line has to be floor, and no two cells in a
    // row may rise by more than one step, or the enemy walks into a wall for
    // ever and the patrol silently stops.
    for (let spawn of SPAWNS) {
        for (let i = 0; i < spawn.Route.length; i++) {
            let a = spawn.Route[i];
            let b = spawn.Route[(i + 1) % spawn.Route.length];
            let span = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
            let previous = cell_level(grid, a[0], a[1]);
            let walkable = true;

            for (let s = 1; s <= span * 2; s++) {
                let t = s / (span * 2);
                let x = Math.round(a[0] + (b[0] - a[0]) * t);
                let z = Math.round(a[1] + (b[1] - a[1]) * t);
                let level = cell_level(grid, x, z);
                if (level === SOLID || level - previous > 1) {
                    walkable = false;
                    break;
                }
                previous = level;
            }

            check("patrol leg is walkable", walkable, `${a} -> ${b}`);
            check("patrol leg is unobstructed", !blocked(a, b), `${a} -> ${b}`);
        }
    }
}

// Throwing is how this exits non-zero; naming `process` would mean adding node
// types to the project for one line.
if (failures) {
    throw new Error(`${failures} check(s) failed.`);
}

console.log("All checks passed.");
