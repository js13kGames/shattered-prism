/**
 * # Level
 *
 * Turn the map data into entities.
 *
 * Cells are merged into as few boxes as possible before anything is
 * instantiated. A ten-by-ten room floor becomes one box, not a hundred: it is
 * one draw call instead of a hundred, one static collider instead of a hundred,
 * and one shadow caster instead of a hundred.
 */

import {instantiate} from "../lib/game.js";
import {Vec3, Vec4} from "../lib/math.js";
import {orthographic} from "../lib/projection.js";
import {blueprint_enemy, NEON, STATS} from "./blueprints/blu_enemies.js";
import {blueprint_player} from "./blueprints/blu_player.js";
import {audio_source} from "./components/com_audio_source.js";
import {camera_target} from "./components/com_camera.js";
import {collide} from "./components/com_collide.js";
import {health, pickup, platform, shatter, trigger, TriggerKind} from "./components/com_gameplay.js";
import {lifespan} from "./components/com_lifespan.js";
import {light} from "./components/com_light.js";
import {render_prism} from "./components/com_render.js";
import {RigidKind, rigid_body} from "./components/com_rigid_body.js";
import {set_position, set_rotation, set_scale, transform} from "./components/com_transform.js";
import {Game, Layer} from "./game.js";
import {LightKind} from "../materials/light.js";
import {
    AMMO,
    build_grid,
    CEILING,
    CELL,
    cell_level,
    cell_x,
    cell_z,
    CRATES,
    EXIT,
    Grid,
    GRID_D,
    GRID_W,
    LAMPS,
    level_y,
    LIFTS,
    MEDKITS,
    PADS,
    PILLARS,
    SOLID,
    SPAWNS,
    START,
} from "./map.js";
import {snd_drone} from "./sounds.js";
import {STARTING_AMMO, WEAPONS} from "./weapons.js";
import {World} from "./world.js";

export const CONCRETE: Vec4 = [0.5, 0.5, 0.52, 1];
export const CONCRETE_DARK: Vec4 = [0.4, 0.4, 0.43, 1];
const CONCRETE_ROOF: Vec4 = [0.24, 0.24, 0.27, 1];
const NONE: Vec4 = [0, 0, 0, 0];

/** Near-black, so that only the neon carries colour. */
export const CLEAR_COLOR: Vec4 = [0.02, 0.02, 0.03, 1];
export const FOG_DISTANCE = 70;

/**
 * How deep under the walkable surface a floor slab reaches.
 *
 * Deliberately far deeper than it needs to look right. Box collisions resolve
 * along the axis of least penetration, so a body squeezed into a corner can be
 * pushed *down*; if the slab is thin it pops out underneath and falls out of
 * the world. Twelve units of concrete under every floor makes that impossible.
 */
const BASE = 12;
export const CRATE_HEALTH = 60;

export function scene_level(game: Game) {
    game.World = new World();
    game.ViewportResized = true;
    game.Kills = 0;
    game.Enemies = 0;
    game.Weapon = 0;
    game.Ammo = [...STARTING_AMMO];
    game.Recoil = 0;
    game.Bob = 0;

    let grid = build_grid();

    build_floors(game, grid);
    build_ceilings(game, grid);
    build_walls(game, grid);
    build_features(game, grid);

    // The sun. It is the only shadow caster, and the only reason the courtyard
    // reads as outdoors.
    game.Sun = instantiate(game, [
        transform(),
        set_rotation(-52, 28, 0),
        light(LightKind.Directional, [1, 0.96, 0.86], 0.95),
        camera_target(game.Targets.Sun, orthographic(54, 1, 190)),
    ]);

    // The drone, on an entity of its own: an idle clip on the player would
    // block every one-shot for its whole length.
    instantiate(game, [transform(), audio_source(false, snd_drone)]);

    spawn_enemies(game, grid);

    let player = instantiate(game, [
        ...blueprint_player(game),
        set_position(cell_x(START[0]), floor_top(grid, START[0], START[1]) + 1.2, cell_z(START[1])),
    ]);
    game.PlayerEntity = player;
    game.PlayerEye = game.World.Children[player].Children[0];
    game.PlayerCamera = game.World.Children[game.PlayerEye].Children[0];
    game.Viewmodel = game.World.Children[game.PlayerCamera].Children[0];
}

/** World Y of the walkable surface of a cell. */
function floor_top(grid: Grid, x: number, z: number) {
    return level_y(Math.max(0, cell_level(grid, x, z)));
}

/**
 * Merge the cells a predicate accepts into as few rectangles as possible.
 *
 * ponytail: this is the textbook greedy sweep, not an optimal partition. It
 * turns rooms and corridors into single boxes, which is all it has to do; an
 * optimal one would save a handful of boxes on ragged edges and cost more code
 * than it is worth.
 */
function merge(match: (index: number) => boolean) {
    let used = new Uint8Array(GRID_W * GRID_D);
    let rects: Array<[number, number, number, number]> = [];

    for (let z = 0; z < GRID_D; z++) {
        for (let x = 0; x < GRID_W; x++) {
            let index = z * GRID_W + x;
            if (used[index] || !match(index)) {
                continue;
            }

            let w = 1;
            while (x + w < GRID_W && !used[index + w] && match(index + w)) {
                w++;
            }

            let d = 1;
            grow: while (z + d < GRID_D) {
                for (let k = 0; k < w; k++) {
                    let below = (z + d) * GRID_W + x + k;
                    if (used[below] || !match(below)) {
                        break grow;
                    }
                }
                d++;
            }

            for (let j = z; j < z + d; j++) {
                for (let i = x; i < x + w; i++) {
                    used[j * GRID_W + i] = 1;
                }
            }

            rects.push([x, z, w, d]);
        }
    }

    return rects;
}

/** Instantiate one solid box spanning a rectangle of cells, between two Y values. */
function box(
    game: Game,
    rect: [number, number, number, number],
    bottom: number,
    top: number,
    color: Vec4,
) {
    let [x, z, w, d] = rect;
    return instantiate(game, [
        transform(),
        render_prism(color),
        collide(false, Layer.Terrain, Layer.None),
        rigid_body(RigidKind.Static),
        set_position(
            cell_x(x) + ((w - 1) * CELL) / 2,
            (bottom + top) / 2,
            cell_z(z) + ((d - 1) * CELL) / 2,
        ),
        set_scale(w * CELL, top - bottom, d * CELL),
    ]);
}

function build_floors(game: Game, grid: Grid) {
    // One pass per distinct floor level, so that each merged slab is flat.
    let levels = new Set(grid.Floor);
    levels.delete(SOLID);

    for (let level of levels) {
        for (let rect of merge((i) => grid.Floor[i] === level)) {
            box(game, rect, -BASE, level_y(level), level ? CONCRETE_DARK : CONCRETE);
        }
    }
}

function build_ceilings(game: Game, grid: Grid) {
    for (let rect of merge((i) => grid.Floor[i] !== SOLID && !grid.Sky[i])) {
        box(game, rect, CEILING, CEILING + 1, CONCRETE_ROOF);
    }
}

function build_walls(game: Game, grid: Grid) {
    // Everything that is not floor is rock, from below the deepest slab to
    // above the ceiling.
    for (let rect of merge((i) => grid.Floor[i] === SOLID)) {
        box(game, rect, -BASE, CEILING + 1, CONCRETE_DARK);
    }
}

function build_features(game: Game, grid: Grid) {
    for (let [x, z, height, r, g, b, intensity] of LAMPS) {
        let y = floor_top(grid, x, z) + height;
        // The fitting, and the light it throws.
        instantiate(game, [
            transform(),
            set_position(cell_x(x), y + 0.35, cell_z(z)),
            set_scale(0.9, 0.25, 0.9),
            render_prism([0.1, 0.1, 0.1, 1], [r, g, b, 1.7]),
        ]);
        instantiate(game, [
            transform(),
            set_position(cell_x(x), y, cell_z(z)),
            light(LightKind.Point, [r, g, b], intensity),
        ]);
    }

    for (let [x, z] of PILLARS) {
        instantiate(game, [
            transform(),
            render_prism(CONCRETE_DARK, NONE, true),
            collide(false, Layer.Terrain, Layer.None),
            rigid_body(RigidKind.Static),
            set_position(cell_x(x), floor_top(grid, x, z) + 3.5, cell_z(z)),
            set_scale(2.6, 7, 2.6),
        ]);
    }

    for (let [x, z] of CRATES) {
        instantiate(game, [
            ...blueprint_crate(0),
            set_position(cell_x(x), floor_top(grid, x, z) + 0.9, cell_z(z)),
            set_scale(1.8, 1.8, 1.8),
        ]);
    }

    for (let [x, z, weapon] of AMMO) {
        let neon = WEAPONS[weapon].Neon;
        instantiate(game, [
            transform(),
            set_position(cell_x(x), floor_top(grid, x, z) + 0.5, cell_z(z)),
            set_scale(0.9, 0.6, 0.9),
            render_prism([0.12, 0.12, 0.12, 1], [...neon, 2.4]),
            collide(false, Layer.Pickup, Layer.None, [1.4, 2, 1.4]),
            pickup(0, WEAPONS[weapon].Box, weapon),
        ]);
    }

    for (let [x, z] of MEDKITS) {
        instantiate(game, [
            transform(),
            set_position(cell_x(x), floor_top(grid, x, z) + 0.45, cell_z(z)),
            set_scale(0.8, 0.55, 0.8),
            render_prism([0.12, 0.12, 0.12, 1], [0.4, 1, 0.75, 2.4]),
            collide(false, Layer.Pickup, Layer.None, [1.4, 2, 1.4]),
            pickup(28),
        ]);
    }

    for (let [x, z, up, px, pz] of PADS) {
        let y = floor_top(grid, x, z);
        instantiate(game, [
            transform(),
            set_position(cell_x(x), y + 0.12, cell_z(z)),
            set_scale(CELL * 0.8, 0.24, CELL * 0.8),
            render_prism([0.1, 0.1, 0.12, 1], [0.3, 0.7, 1, 2.4]),
            collide(false, Layer.Trigger, Layer.None, [1, 2.5, 1]),
            trigger(TriggerKind.Pad, [px, up, pz]),
        ]);
        instantiate(game, [
            transform(),
            set_position(cell_x(x), y + 1.4, cell_z(z)),
            light(LightKind.Point, [0.3, 0.7, 1], 1.4),
        ]);
    }

    for (let [x, z, low, high] of LIFTS) {
        instantiate(game, [
            transform(),
            set_position(cell_x(x), level_y(low) - 0.3, cell_z(z)),
            set_scale(CELL * 0.95, 0.6, CELL * 0.95),
            render_prism(CONCRETE, [0.5, 0.8, 1, 0.5]),
            // The collider is flagged dynamic so that its box is recomputed as
            // it moves; the body is kinematic so that nothing pushes it back.
            collide(true, Layer.Terrain, Layer.None),
            rigid_body(RigidKind.Kinematic),
            platform(level_y(low) - 0.3, level_y(high) - 0.3),
        ]);
    }

    // The way out.
    let exit_y = floor_top(grid, EXIT[0], EXIT[1]);
    instantiate(game, [
        transform(),
        set_position(cell_x(EXIT[0]), exit_y + 1.8, cell_z(EXIT[1])),
        set_scale(3.2, 3.6, 0.5),
        render_prism([0.1, 0.1, 0.1, 1], [0.4, 1, 0.6, 2.2]),
        collide(false, Layer.Trigger, Layer.None, [1, 1, 3]),
        trigger(TriggerKind.Exit),
    ]);
    instantiate(game, [
        transform(),
        set_position(cell_x(EXIT[0]), exit_y + 2, cell_z(EXIT[1])),
        light(LightKind.Point, [0.4, 1, 0.6], 3.4),
    ]);
}

function spawn_enemies(game: Game, grid: Grid) {
    for (let i = 0; i < SPAWNS.length; i++) {
        let spawn = SPAWNS[i];
        let stats = STATS[spawn.Kind];
        let route: Array<Vec3> = spawn.Route.map(([x, z]) => [
            cell_x(x),
            floor_top(grid, x, z) + stats.Rise,
            cell_z(z),
        ]);

        instantiate(game, [
            ...blueprint_enemy(spawn.Kind, route, NEON[i % NEON.length]),
            set_position(route[0][0], route[0][1], route[0][2]),
        ]);
        game.Enemies++;
    }
}

/**
 * A crate: cover you can shoot away. Generation 1 is still cover, generation 2
 * is rubble that lands, lies there, and is gone.
 */
export function blueprint_crate(generation: number) {
    let common = [
        transform(),
        render_prism(generation ? CONCRETE_ROOF : CONCRETE_DARK, NONE),
        // The mask has to name Terrain, not None: a collider with an empty mask
        // is only ever found by colliders that name *it*, and nothing names a
        // chunk, so it would fall through the floor.
        collide(true, Layer.Terrain, Layer.Terrain),
        rigid_body(generation ? RigidKind.Dynamic : RigidKind.Static, 0.2),
    ];

    if (generation > 1) {
        return [...common, lifespan(2.5)];
    }

    if (generation === 0) {
        return [...common, health(CRATE_HEALTH), shatter(0)];
    }

    return [...common, health(CRATE_HEALTH / 4), shatter(1), lifespan(11)];
}
