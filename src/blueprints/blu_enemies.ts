/**
 * # Enemies
 *
 * Three silhouettes, all built out of the same two prisms. What tells them
 * apart at 320x240 is shape and colour: the sentinel is a heavy quadruped, the
 * gunner stands upright with a cannon for an arm, and the hound is long and low
 * and much too fast.
 *
 * Their bodies are near-black. Only the horn, the eyes and the vents glow, so
 * what you actually read in a dark corridor is a pattern of neon.
 */

import {Vec3, Vec4} from "../../lib/math.js";
import {audio_source} from "../components/com_audio_source.js";
import {children} from "../components/com_children.js";
import {collide} from "../components/com_collide.js";
import {control_ai, health} from "../components/com_gameplay.js";
import {move} from "../components/com_move.js";
import {render_prism} from "../components/com_render.js";
import {RigidKind, rigid_body} from "../components/com_rigid_body.js";
import {transform} from "../components/com_transform.js";
import {Game, Layer} from "../game.js";
import {EnemyKind} from "../map.js";

/** Hyper-saturated, because nothing else in the megastructure has any colour. */
export const NEON: Array<[number, number, number]> = [
    [1, 0.1, 0.7],
    [0.2, 1, 0.9],
    [1, 0.8, 0.1],
    [0.6, 0.2, 1],
    [0.3, 1, 0.2],
];

/** The bodies are barely lit; the neon does all the work. */
const HIDE: Vec4 = [0.07, 0.07, 0.09, 1];
const PLATE: Vec4 = [0.13, 0.13, 0.16, 1];
const NONE: Vec4 = [0, 0, 0, 0];

/** Emissive alpha over 1 saturates the channel, which is what trips the bloom. */
const GLOW = 2.4;
const DIM = 0.45;

export interface EnemyStats {
    Health: number;
    Speed: number;
    /** Half-height, and so the Y a spawn is placed at above the floor. */
    Rise: number;
    Collider: Vec3;
    /** How close it has to be to hurt you in melee. Gunners shoot instead. */
    Reach: number;
    Damage: number;
    Interval: number;
    /** How far it can see. */
    Sight: number;
}

export const STATS: Array<EnemyStats> = [
    // Sentinel.
    {
        Health: 70,
        Speed: 5.4,
        Rise: 1.35,
        Collider: [1.4, 2.7, 2.2],
        Reach: 2.8,
        Damage: 13,
        Interval: 1.3,
        Sight: 34,
    },
    // Gunner.
    {
        Health: 45,
        Speed: 3.8,
        Rise: 1.55,
        Collider: [1.2, 3.1, 1.2],
        Reach: 30,
        Damage: 9,
        Interval: 1.5,
        Sight: 42,
    },
    // Hound.
    {
        Health: 28,
        Speed: 8.6,
        Rise: 0.95,
        Collider: [1, 1.9, 2.2],
        Reach: 2.4,
        Damage: 8,
        Interval: 0.8,
        Sight: 30,
    },
];

function part(
    game: Game,
    position: Vec3,
    scale: Vec3,
    color: Vec4,
    emissive: Vec4 = NONE,
    cylinder = false,
    rotation?: [number, number, number, number],
) {
    return [
        transform(position, rotation, scale),
        render_prism(cylinder ? game.MeshCylinder : game.MeshCube, color, emissive),
    ];
}

export function blueprint_enemy(
    game: Game,
    kind: EnemyKind,
    route: Array<Vec3>,
    neon: [number, number, number],
) {
    let stats = STATS[kind];
    let dim: Vec4 = [...neon, DIM];
    let glow: Vec4 = [...neon, GLOW];

    return [
        transform(),
        control_ai(kind, route, neon),
        move(stats.Speed, 0),
        collide(true, Layer.Enemy, Layer.Terrain, stats.Collider),
        rigid_body(RigidKind.Dynamic, 0),
        health(stats.Health),
        audio_source(true),
        children(...body(game, kind, dim, glow)),
    ];
}

function body(game: Game, kind: EnemyKind, dim: Vec4, glow: Vec4) {
    if (kind === EnemyKind.Gunner) {
        return [
            // Torso, tapering into a chest plate.
            part(game, [0, 0.25, 0], [0.9, 1.1, 0.7], HIDE),
            part(game, [0, 0.5, 0.36], [0.7, 0.55, 0.12], PLATE, dim),
            // Head with a low, wide visor.
            part(game, [0, 1.1, 0.05], [0.5, 0.45, 0.5], HIDE),
            part(game, [0, 1.12, 0.3], [0.4, 0.09, 0.06], HIDE, glow),
            // Horn, swept back over the skull.
            part(game, [0, 1.5, -0.1], [0.12, 0.85, 0.12], HIDE, glow, true, [0.2, 0, 0, 0.98]),
            // Left arm.
            part(game, [-0.6, 0.35, 0], [0.22, 0.9, 0.22], HIDE, NONE, true),
            // Right arm is a cannon.
            part(game, [0.62, 0.4, 0.1], [0.3, 0.7, 0.3], PLATE, NONE, true),
            part(game, [0.62, 0.3, 0.62], [0.24, 0.75, 0.24], HIDE, NONE, true, [
                0.7071, 0, 0, 0.7071,
            ]),
            part(game, [0.62, 0.3, 1], [0.16, 0.16, 0.1], HIDE, glow),
            // Backpack vents.
            part(game, [0, 0.55, -0.44], [0.55, 0.5, 0.2], PLATE, dim),
            // Legs.
            part(game, [-0.26, -0.75, 0], [0.26, 1.2, 0.26], HIDE, NONE, true),
            part(game, [0.26, -0.75, 0], [0.26, 1.2, 0.26], HIDE, NONE, true),
            part(game, [-0.26, -1.45, 0.12], [0.3, 0.16, 0.5], PLATE),
            part(game, [0.26, -1.45, 0.12], [0.3, 0.16, 0.5], PLATE),
        ];
    }

    if (kind === EnemyKind.Hound) {
        return [
            // Long low body in two segments.
            part(game, [0, 0.1, -0.3], [0.62, 0.5, 0.9], HIDE),
            part(game, [0, 0.14, 0.5], [0.55, 0.45, 0.7], HIDE),
            // Spine ridge.
            part(game, [0, 0.42, 0], [0.1, 0.2, 1.5], PLATE, dim),
            // Long head.
            part(game, [0, 0.16, 1.15], [0.36, 0.32, 0.6], HIDE),
            part(game, [0, 0.16, 1.46], [0.3, 0.08, 0.06], HIDE, glow),
            // Horn, low and forward: this one leads with its face.
            part(game, [0, 0.44, 1.3], [0.1, 0.95, 0.1], HIDE, glow, true, [
                -0.6, 0, 0, 0.8,
            ]),
            // Four thin legs.
            part(game, [-0.32, -0.42, 0.55], [0.14, 1, 0.14], HIDE, NONE, true),
            part(game, [0.32, -0.42, 0.55], [0.14, 1, 0.14], HIDE, NONE, true),
            part(game, [-0.32, -0.42, -0.5], [0.14, 1, 0.14], HIDE, NONE, true),
            part(game, [0.32, -0.42, -0.5], [0.14, 1, 0.14], HIDE, NONE, true),
            // Tail spike.
            part(game, [0, 0.28, -0.95], [0.1, 0.7, 0.1], HIDE, dim, true, [
                0.55, 0, 0, 0.83,
            ]),
        ];
    }

    // Sentinel: the heavy one.
    return [
        // Barrel body with armour plates down the flanks.
        part(game, [0, 0.2, 0], [1.15, 0.9, 1.8], HIDE),
        part(game, [-0.62, 0.3, 0], [0.12, 0.6, 1.4], PLATE, dim),
        part(game, [0.62, 0.3, 0], [0.12, 0.6, 1.4], PLATE, dim),
        // Shoulder blocks.
        part(game, [-0.5, 0.7, 0.5], [0.4, 0.4, 0.6], PLATE),
        part(game, [0.5, 0.7, 0.5], [0.4, 0.4, 0.6], PLATE),
        // Head, jaw and eyes.
        part(game, [0, 0.8, 1], [0.6, 0.55, 0.75], HIDE),
        part(game, [0, 0.55, 1.28], [0.5, 0.2, 0.35], PLATE),
        part(game, [0, 0.92, 1.32], [0.44, 0.1, 0.06], HIDE, glow),
        // The horn.
        part(game, [0, 1.4, 1.2], [0.17, 1.2, 0.17], HIDE, glow, true, [-0.26, 0, 0, 0.97]),
        // Four heavy legs with hooves.
        part(game, [-0.45, -0.78, 0.62], [0.24, 1.15, 0.24], HIDE, NONE, true),
        part(game, [0.45, -0.78, 0.62], [0.24, 1.15, 0.24], HIDE, NONE, true),
        part(game, [-0.45, -0.78, -0.62], [0.24, 1.15, 0.24], HIDE, NONE, true),
        part(game, [0.45, -0.78, -0.62], [0.24, 1.15, 0.24], HIDE, NONE, true),
        part(game, [-0.45, -1.36, 0.62], [0.3, 0.18, 0.34], PLATE, dim),
        part(game, [0.45, -1.36, 0.62], [0.3, 0.18, 0.34], PLATE, dim),
        // Tail.
        part(game, [0, 0.5, -1], [0.12, 0.9, 0.12], HIDE, dim, true, [0.45, 0, 0, 0.89]),
    ];
}
