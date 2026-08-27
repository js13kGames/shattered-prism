import {Vec4} from "../../lib/math.js";
import {audio_source} from "../components/com_audio_source.js";
import {children} from "../components/com_children.js";
import {collide} from "../components/com_collide.js";
import {AiKind, control_ai, health} from "../components/com_gameplay.js";
import {move} from "../components/com_move.js";
import {render_prism} from "../components/com_render.js";
import {RigidKind, rigid_body} from "../components/com_rigid_body.js";
import {transform} from "../components/com_transform.js";
import {Game, Layer} from "../game.js";

/** Hyper-saturated, because nothing else in the arena has any colour at all. */
export const NEON: Array<[number, number, number]> = [
    [1, 0.1, 0.7],
    [0.2, 1, 0.9],
    [1, 0.8, 0.1],
    [0.6, 0.2, 1],
    [0.3, 1, 0.2],
];

/** The unicorn's own body is barely lit; the neon parts do all the work. */
const HIDE: Vec4 = [0.06, 0.06, 0.08, 1];
/** Emissive alpha over 1 saturates the channel, which is what trips the bloom. */
const GLOW = 2.2;
const DIM = 0.5;

export const UNICORN_HEIGHT = 1.3;

/**
 * A unicorn is intersecting cubes and cylinders and nothing else: no imported
 * mesh, no texture, one material.
 */
export function blueprint_unicorn(game: Game, kind: AiKind, neon: [number, number, number]) {
    let dim: Vec4 = [...neon, DIM];
    let glow: Vec4 = [...neon, GLOW];
    // Slower than the player's 9, so a crowd can always be kited.
    let speed = kind === AiKind.Leaper ? 4.5 : 5.5;

    return [
        transform(),
        control_ai(kind, neon),
        move(speed, 0),
        collide(true, Layer.Enemy, Layer.Terrain, [1.3, 2.6, 2.2]),
        rigid_body(RigidKind.Dynamic, 0),
        health(kind === AiKind.Leaper ? 60 : 40),
        audio_source(true),
        children(
            // Body.
            [
                transform([0, 0.15, 0], undefined, [1.1, 0.8, 1.7]),
                render_prism(game.MeshCube, HIDE, dim),
            ],
            // Head.
            [
                transform([0, 0.75, 0.95], undefined, [0.55, 0.55, 0.7]),
                render_prism(game.MeshCube, HIDE, dim),
            ],
            // Horn: the brightest thing in the game, and the thing you aim at.
            [
                transform([0, 1.3, 1.15], [-0.26, 0, 0, 0.97], [0.16, 1.1, 0.16]),
                render_prism(game.MeshCylinder, HIDE, glow),
            ],
            // Eyes, one bar across the head.
            [
                transform([0, 0.85, 1.3], undefined, [0.42, 0.1, 0.06]),
                render_prism(game.MeshCube, HIDE, glow),
            ],
            ...legs(game, dim),
        ),
    ];
}

function legs(game: Game, dim: Vec4) {
    let out = [];
    for (let x of [-0.42, 0.42]) {
        for (let z of [-0.6, 0.6]) {
            out.push([
                transform([x, -0.75, z], undefined, [0.22, 1.1, 0.22]),
                render_prism(game.MeshCylinder, HIDE, dim),
            ]);
        }
    }
    return out;
}
