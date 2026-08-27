/**
 * # EmitParticles
 *
 * The `EmitParticles` component makes the entity emit particles, updated by
 * [`sys_particles`](sys_particles.html) and drawn by
 * [`sys_render_forward`](sys_render_forward.html).
 */

import {Entity} from "../../lib/world.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

export interface EmitParticles {
    Lifespan: number;
    Frequency: number;
    Speed: number;
    /** 0 emits along the entity's forward axis, 1 emits in every direction. */
    Spread: number;
    /** How many particles to emit per tick. */
    Count: number;
    Instances: Array<number>;
    SinceLast: number;
}

/**
 * Add `EmitParticles` to an entity.
 *
 * @param lifespan How long particles live for.
 * @param frequency How often particles spawn.
 * @param speed How fast particles move.
 * @param spread 0 for a directed jet, 1 for a ball.
 * @param count How many particles per emission.
 */
export function emit_particles(
    lifespan: number,
    frequency: number,
    speed: number,
    spread = 0,
    count = 1,
) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.EmitParticles;
        game.World.EmitParticles[entity] = {
            Lifespan: lifespan,
            Frequency: frequency,
            Speed: speed,
            Spread: spread,
            Count: count,
            Instances: [],
            // Fire on the first tick, so that a one-shot burst with a huge
            // Frequency emits everything at once and then never again.
            SinceLast: frequency,
        };
    };
}
