import {Vec4} from "../../lib/math.js";
import {Mesh} from "../../lib/mesh.js";
import {collide} from "../components/com_collide.js";
import {health, shatter} from "../components/com_gameplay.js";
import {lifespan} from "../components/com_lifespan.js";
import {render_prism} from "../components/com_render.js";
import {RigidKind, rigid_body} from "../components/com_rigid_body.js";
import {transform} from "../components/com_transform.js";
import {Game, Layer} from "../game.js";

/** Strictly monochromatic concrete. Every prop in the arena is one of these. */
export const CONCRETE: Vec4 = [0.5, 0.5, 0.52, 1];
export const CONCRETE_DARK: Vec4 = [0.34, 0.34, 0.37, 1];

/** Health of an intact prop; chunks get a fraction of it. */
export const PROP_HEALTH = 90;

/**
 * A brutalist block: static, solid, and destructible.
 *
 * Generation 0 is the block as placed. Shooting it apart replaces it with
 * generation 1 chunks, and those with generation 2 rubble, which only falls and
 * expires. That is the whole "arena degrades" rule, with no new assets.
 */
export function blueprint_prop(game: Game, mesh: Mesh, generation: number) {
    return [
        transform(),
        render_prism(mesh, generation ? CONCRETE_DARK : CONCRETE),
        collide(false, Layer.Terrain, Layer.None),
        rigid_body(RigidKind.Static),
        health(PROP_HEALTH / (generation + 1) ** 2),
        shatter(generation),
    ];
}

/**
 * A piece thrown off a prop that was shot apart.
 *
 * Generation 1 is still cover and still shootable, with a short life so the
 * arena does not silt up. Generation 2 is rubble: it lands, it lies there, and
 * then it is gone. Nothing shatters a third time.
 *
 * ponytail: collisions between dynamic bodies are O(n^2), and chunks are the
 * only thing that can make n large. Lifespans keep the population bounded; if
 * that ever stops being enough, cap it by recycling the oldest chunk.
 */
export function blueprint_chunk(game: Game, mesh: Mesh, generation: number) {
    let common = [
        transform(),
        render_prism(mesh, CONCRETE_DARK),
        // The mask has to name Terrain, not None: a collider with an empty mask
        // is only ever found by colliders that name *it*, and nothing does, so
        // the chunk would fall through the floor.
        collide(true, Layer.Terrain, Layer.Terrain),
        rigid_body(RigidKind.Dynamic, 0.2),
    ];

    if (generation > 1) {
        // Rubble. It lands, it lies there, and then it is gone for good.
        return [...common, lifespan(2.5)];
    }

    return [...common, health(PROP_HEALTH / 4), shatter(generation), lifespan(11)];
}

/** The floor and the outer walls: solid, and never destructible. */
export function blueprint_wall(game: Game) {
    return [
        transform(),
        render_prism(game.MeshCube, CONCRETE_DARK),
        collide(false, Layer.Terrain, Layer.None),
        rigid_body(RigidKind.Static),
    ];
}
