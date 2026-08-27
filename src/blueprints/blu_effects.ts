import {Vec4} from "../../lib/math.js";
import {Entity} from "../../lib/world.js";
import {collide} from "../components/com_collide.js";
import {emit_particles} from "../components/com_emit_particles.js";
import {pickup, projectile} from "../components/com_gameplay.js";
import {lifespan} from "../components/com_lifespan.js";
import {render_particles, render_prism} from "../components/com_render.js";
import {RigidKind, rigid_body} from "../components/com_rigid_body.js";
import {transform} from "../components/com_transform.js";
import {Game, Layer} from "../game.js";

export const REBAR_DAMAGE = 34;
export const REBAR_SPEED = 70;
/** Rebar is crude concrete, so it is grey and barely glows at all. */
const REBAR_COLOR: Vec4 = [0.45, 0.45, 0.44, 1];

/** A heavy concrete rebar: a scaled cylinder that flies in a straight line. */
export function blueprint_rebar(game: Game, owner: Entity) {
    return [
        transform(undefined, undefined, [0.12, 1.4, 0.12]),
        render_prism(game.MeshCylinder, REBAR_COLOR, [1, 0.9, 0.8, 0.2]),
        collide(true, Layer.Projectile, Layer.Terrain | Layer.Enemy, [0.4, 0.4, 0.4]),
        // No bounce, no friction, no gravity: a rebar flies dead straight.
        rigid_body(RigidKind.Dynamic, 0, 0, 0),
        projectile(REBAR_DAMAGE, owner),
        lifespan(2.5),
    ];
}

export const PICKUP_HEAL = 9;

/** A neon pixel shaken loose by a close-range kill. Run into it to heal. */
export function blueprint_pickup(game: Game, neon: [number, number, number]) {
    return [
        transform(undefined, undefined, [0.28, 0.28, 0.28]),
        render_prism(game.MeshCube, [0.1, 0.1, 0.1, 1], [...neon, 2.6]),
        collide(true, Layer.Pickup, Layer.Terrain, [0.5, 0.5, 0.5]),
        rigid_body(RigidKind.Dynamic, 0.4),
        pickup(PICKUP_HEAL),
        lifespan(9),
    ];
}

/**
 * A one-shot ball of neon. The emitter fires everything on its first tick and
 * then expires; the particles outlive it by their own lifespan.
 */
export function blueprint_burst(
    game: Game,
    neon: [number, number, number],
    count: number,
    speed: number,
    size: number,
) {
    return [
        transform(),
        emit_particles(0.7, 100, speed, 1, count),
        render_particles([...neon, 1], size, [...neon, 0], 0),
        lifespan(0.8),
    ];
}
