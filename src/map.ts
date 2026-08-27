/**
 * # Map
 *
 * The level, as data, plus the pure functions that read it.
 *
 * Nothing here touches the DOM or WebGL, so `src/selftest.ts` can import it and
 * walk the level without a browser. That is the point: a labyrinth that cannot
 * be finished is a bug you cannot see from a screenshot.
 *
 * The level is a grid of cells. A cell is either solid or a floor at some step
 * level. Rectangles are painted into the grid in order, so a later rectangle
 * overwrites an earlier one, which is what makes stairs easy to write.
 */

export const GRID_W = 40;
export const GRID_D = 34;
/** World units per cell. */
export const CELL = 4;
/** World units per floor level. */
export const STEP = 0.6;
/** The tallest ledge the player can walk up without jumping. */
export const STEP_HEIGHT = 0.75;
/** Ceiling height above level 0, for the roofed parts of the level. */
export const CEILING = 9;

export const SOLID = -1;

/** [x, z, width, depth, level, open to the sky] */
type Room = [number, number, number, number, number, number];

/**
 * The megastructure. Read it as a floor plan: south-west start, a courtyard in
 * the middle open to the sky, a balcony above it to the east, and a pit in the
 * north that has to be crossed to reach the exit.
 */
const ROOMS: Array<Room> = [
    // Start room and the corridor east out of it.
    [3, 26, 8, 6, 0, 0],
    [11, 28, 10, 3, 0, 0],

    // Stair hall. The steps themselves are painted over this below.
    [21, 23, 7, 9, 0, 0],

    // The courtyard, open to the sky. This is where the sun gets in.
    [9, 12, 11, 13, 0, 1],
    // Courtyard down to the south corridor.
    [12, 25, 4, 3, 0, 0],

    // West wing and its link to the courtyard.
    [3, 14, 5, 8, 0, 0],
    [8, 17, 1, 3, 0, 0],

    // The balcony, one storey up, overlooking the courtyard.
    [20, 12, 15, 12, 6, 0],
    // North corridor off the balcony.
    [28, 6, 3, 6, 6, 0],

    // The chasm: two ledges a storey up, with a pit between them.
    [14, 6, 17, 2, 6, 1],
    [14, 4, 17, 2, 0, 1],
    [14, 2, 17, 2, 6, 1],

    // Exit room.
    [31, 2, 6, 6, 6, 0],
];

/** [x, z, width, count, dz, first level] — one cell deep per step. */
const STAIRS: Array<[number, number, number, number, number, number]> = [
    // Up the stair hall, south to north, ground to balcony.
    [22, 29, 5, 6, -1, 1],
];

/** Where the player starts, in cells. */
export const START: [number, number] = [6, 29];
/** The way out, in cells. */
export const EXIT: [number, number] = [34, 4];

/** Lifts: [x, z, low level, high level]. Each is one cell. */
export const LIFTS: Array<[number, number, number, number]> = [
    // Courtyard up to the balcony, as a shortcut back.
    [19, 21, 0, 6],
    [19, 22, 0, 6],
];

/** Jump pads: [x, z, up speed, push x, push z]. */
export const PADS: Array<[number, number, number, number, number]> = [
    // Off the south ledge, over the pit.
    [22, 7, 17, 0, -13],
    [26, 7, 17, 0, -13],
    // Out of the pit, if you miss.
    [18, 4, 22, 0, 0],
    [22, 5, 20, 0, -8],
    [27, 4, 22, 0, 0],
];

/** Lamps: [x, z, height above the floor, r, g, b, intensity]. */
export const LAMPS: Array<[number, number, number, number, number, number, number]> = [
    [6, 28, 5, 1, 0.72, 0.4, 2.6],
    [15, 29, 5, 1, 0.72, 0.4, 2.6],
    [24, 30, 5, 1, 0.72, 0.4, 2.4],
    [24, 25, 5, 0.5, 0.8, 1, 2.4],
    [5, 16, 5, 1, 0.72, 0.4, 2.6],
    [5, 20, 5, 1, 0.72, 0.4, 2.6],
    [23, 14, 5, 0.5, 0.8, 1, 3],
    [32, 15, 5, 0.5, 0.8, 1, 3],
    [29, 8, 5, 1, 0.72, 0.4, 2.6],
    [33, 4, 5, 0.4, 1, 0.6, 3.6],
    [17, 6, 5, 0.5, 0.8, 1, 2.6],
    [29, 3, 5, 1, 0.72, 0.4, 2.6],
];

/** Destructible crates: [x, z]. */
export const CRATES: Array<[number, number]> = [
    [8, 27],
    [9, 30],
    [17, 29],
    [12, 14],
    [17, 21],
    [11, 22],
    [4, 15],
    [6, 21],
    [23, 17],
    [31, 20],
    [26, 13],
    [16, 3],
    [28, 3],
    [33, 6],
];

/** Pillars standing in the courtyard, to cast shadows: [x, z]. */
export const PILLARS: Array<[number, number]> = [
    [12, 16],
    [16, 16],
    [12, 20],
    [16, 20],
    [14, 18],
];

/** Ammo boxes: [x, z, weapon index]. */
export const AMMO: Array<[number, number, number]> = [
    [4, 30, 1],
    [19, 29, 1],
    [5, 18, 2],
    [14, 13, 1],
    [11, 24, 2],
    [26, 22, 1],
    [33, 13, 2],
    [29, 10, 1],
    [15, 7, 2],
    [29, 2, 1],
];

/** Medkits: [x, z]. */
export const MEDKITS: Array<[number, number]> = [
    [3, 27],
    [7, 15],
    [3, 21],
    [18, 13],
    [10, 23],
    [34, 22],
    [21, 12],
    [30, 7],
    [16, 2],
    [36, 6],
];

export const enum EnemyKind {
    /** Walks a route, charges and gores when it sees you. */
    Sentinel,
    /** Walks a route, stops and shoots when it sees you. */
    Gunner,
    /** Sleeps until it sees you, then runs you down. */
    Hound,
}

/** [kind, route as pairs of cells...] */
export interface Spawn {
    Kind: EnemyKind;
    Route: Array<[number, number]>;
}

export const SPAWNS: Array<Spawn> = [
    // South corridor.
    {Kind: EnemyKind.Sentinel, Route: [[13, 29], [19, 29]]},
    {Kind: EnemyKind.Gunner, Route: [[17, 29], [12, 29]]},
    // Start room, one slow patrol.
    {Kind: EnemyKind.Sentinel, Route: [[5, 27], [9, 27], [9, 30], [5, 30]]},
    // West wing.
    {Kind: EnemyKind.Sentinel, Route: [[4, 15], [4, 21], [6, 21], [6, 15]]},
    {Kind: EnemyKind.Hound, Route: [[6, 18]]},
    // Courtyard.
    {Kind: EnemyKind.Hound, Route: [[11, 14]]},
    {Kind: EnemyKind.Hound, Route: [[17, 23]]},
    {Kind: EnemyKind.Gunner, Route: [[10, 18], [18, 18]]},
    {Kind: EnemyKind.Sentinel, Route: [[14, 13], [14, 23]]},
    // Stair hall.
    {Kind: EnemyKind.Gunner, Route: [[24, 30], [24, 26]]},
    // Balcony.
    {Kind: EnemyKind.Gunner, Route: [[22, 14], [33, 14]]},
    {Kind: EnemyKind.Gunner, Route: [[33, 22], [22, 22]]},
    {Kind: EnemyKind.Sentinel, Route: [[25, 13], [25, 22], [32, 22], [32, 13]]},
    {Kind: EnemyKind.Hound, Route: [[28, 18]]},
    // North corridor.
    {Kind: EnemyKind.Sentinel, Route: [[29, 7], [29, 11]]},
    // Chasm ledges.
    {Kind: EnemyKind.Gunner, Route: [[16, 6], [29, 6]]},
    {Kind: EnemyKind.Gunner, Route: [[28, 2], [16, 2]]},
    // Exit room. The last two are waiting for you.
    {Kind: EnemyKind.Sentinel, Route: [[32, 3], [35, 6]]},
    {Kind: EnemyKind.Hound, Route: [[35, 3]]},
];

export interface Grid {
    /** Floor level per cell, or SOLID. */
    Floor: Int8Array;
    /** 1 where the cell has no ceiling. */
    Sky: Uint8Array;
}

/** Paint the rectangles into a grid. */
export function build_grid(): Grid {
    let floor = new Int8Array(GRID_W * GRID_D).fill(SOLID);
    let sky = new Uint8Array(GRID_W * GRID_D);

    for (let [x, z, w, d, level, open] of ROOMS) {
        for (let j = z; j < z + d; j++) {
            for (let i = x; i < x + w; i++) {
                floor[j * GRID_W + i] = level;
                sky[j * GRID_W + i] = open;
            }
        }
    }

    for (let [x, z, w, count, dz, first] of STAIRS) {
        for (let s = 0; s < count; s++) {
            for (let i = x; i < x + w; i++) {
                floor[(z + s * dz) * GRID_W + i] = first + s;
            }
        }
    }

    return {Floor: floor, Sky: sky};
}

export function cell_level(grid: Grid, x: number, z: number) {
    if (x < 0 || z < 0 || x >= GRID_W || z >= GRID_D) {
        return SOLID;
    }
    return grid.Floor[z * GRID_W + x];
}

/** World-space centre of a cell. */
export function cell_x(x: number) {
    return (x - GRID_W / 2 + 0.5) * CELL;
}

export function cell_z(z: number) {
    return (z - GRID_D / 2 + 0.5) * CELL;
}

/** World Y of the walkable surface of a floor level. */
export function level_y(level: number) {
    return level * STEP;
}

/**
 * Flood-fill the level from the start, the way the player can actually move:
 * step up one level, drop any distance, ride a lift, or take a jump pad.
 *
 * Returns the set of reachable cell indices.
 */
export function reachable(grid: Grid): Set<number> {
    // Lifts and pads join places that plain walking cannot.
    let links = new Map<number, Array<number>>();
    let link = (a: number, b: number) => {
        if (!links.has(a)) {
            links.set(a, []);
        }
        links.get(a)!.push(b);
    };

    for (let [x, z] of LIFTS) {
        // A lift joins its own cell to every neighbour, at either end.
        for (let [dx, dz] of NEIGHBOURS) {
            let nx = x + dx;
            let nz = z + dz;
            if (cell_level(grid, nx, nz) !== SOLID) {
                link(z * GRID_W + x, nz * GRID_W + nx);
                link(nz * GRID_W + nx, z * GRID_W + x);
            }
        }
    }

    for (let [x, z, , px, pz] of PADS) {
        // A pad throws you a few cells along its push direction.
        let steps = Math.round(Math.hypot(px, pz) / 5) + 1;
        for (let s = 1; s <= steps; s++) {
            let nx = x + Math.round((px / (Math.hypot(px, pz) || 1)) * s);
            let nz = z + Math.round((pz / (Math.hypot(px, pz) || 1)) * s);
            if (cell_level(grid, nx, nz) !== SOLID) {
                link(z * GRID_W + x, nz * GRID_W + nx);
            }
        }
        // A straight-up pad just gets you out of a pit onto anything adjacent.
        if (!px && !pz) {
            for (let [dx, dz] of NEIGHBOURS) {
                if (cell_level(grid, x + dx, z + dz) !== SOLID) {
                    link(z * GRID_W + x, (z + dz) * GRID_W + (x + dx));
                }
            }
        }
    }

    let start = START[1] * GRID_W + START[0];
    let seen = new Set<number>([start]);
    let queue = [start];

    while (queue.length) {
        let here = queue.pop()!;
        let x = here % GRID_W;
        let z = (here - x) / GRID_W;
        let level = cell_level(grid, x, z);

        let step_to = (index: number) => {
            if (!seen.has(index)) {
                seen.add(index);
                queue.push(index);
            }
        };

        for (let [dx, dz] of NEIGHBOURS) {
            let nx = x + dx;
            let nz = z + dz;
            let next = cell_level(grid, nx, nz);
            if (next === SOLID) {
                continue;
            }
            // Up at most one step; down as far as you like.
            if ((next - level) * STEP <= STEP_HEIGHT) {
                step_to(nz * GRID_W + nx);
            }
        }

        for (let index of links.get(here) || []) {
            step_to(index);
        }
    }

    return seen;
}

const NEIGHBOURS: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
];
