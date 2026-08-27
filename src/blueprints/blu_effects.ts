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
import {Weapon} from "../weapons.js";

/**
 * Anything the player fires. The weapon table decides what it looks like, how
 * hard it hits, and whether it falls.
 */
export function blueprint_shot(game: Game, weapon: Weapon, owner: Entity) {
    return [
        transform(undefined, undefined, [...weapon.Size]),
        render_prism(
            weapon.Splash ? game.MeshCylinder : game.MeshCube,
            weapon.Color,
            [...weapon.Neon, weapon.Splash ? 2.4 : 0.8],
        ),
        collide(true, Layer.Projectile, Layer.Terrain | Layer.Enemy, [0.5, 0.5, 0.5]),
        // No bounce and no friction. Only the mortar feels gravity.
        rigid_body(RigidKind.Dynamic, 0, 0, weapon.Gravity),
        projectile(weapon.Damage, weapon.Splash, owner, true, weapon.Neon),
        lifespan(weapon.Lifespan),
    ];
}

/** What the gunners shoot back. */
export function blueprint_bolt(
    game: Game,
    owner: Entity,
    damage: number,
    neon: [number, number, number],
) {
    return [
        transform(undefined, undefined, [0.3, 0.3, 0.3]),
        render_prism(game.MeshCube, [0.1, 0.1, 0.1, 1], [...neon, 2.8]),
        collide(true, Layer.Projectile, Layer.Terrain | Layer.Player, [0.6, 0.6, 0.6]),
        rigid_body(RigidKind.Dynamic, 0, 0, 0),
        projectile(damage, 0, owner, false, neon),
        lifespan(3),
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

const DROP_COLOR: Vec4 = [0.1, 0.1, 0.1, 1];
export const DROP_HEAL = 8;

/** A neon pixel shaken loose by a close-range kill. Run into it to heal. */
export function blueprint_drop(game: Game, neon: [number, number, number]) {
    return [
        transform(undefined, undefined, [0.28, 0.28, 0.28]),
        render_prism(game.MeshCube, DROP_COLOR, [...neon, 2.6]),
        collide(true, Layer.Pickup, Layer.Terrain, [0.6, 0.6, 0.6]),
        rigid_body(RigidKind.Dynamic, 0.4),
        pickup(DROP_HEAL),
        lifespan(12),
    ];
}
