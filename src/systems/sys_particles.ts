/**
 * # sys_particles
 *
 * Update the instance arrays of [particle emitters](com_emit_particles.html),
 * to be passed to the shaders.
 */

import {mat4_get_forward, mat4_get_translation} from "../../lib/mat4.js";
import {Vec3} from "../../lib/math.js";
import {float} from "../../lib/random.js";
import {vec3_normalize} from "../../lib/vec3.js";
import {Entity} from "../../lib/world.js";
import {FLOATS_PER_PARTICLE, MAX_PARTICLES} from "../components/com_render.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.Transform | Has.EmitParticles;

export function sys_particles(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) == QUERY) {
            update(game, i, delta);
        }
    }
}

let origin: Vec3 = [0, 0, 0];
let forward: Vec3 = [0, 0, 0];
let direction: Vec3 = [0, 0, 0];

function update(game: Game, entity: Entity, delta: number) {
    let emitter = game.World.EmitParticles[entity];
    let transform = game.World.Transform[entity];

    emitter.SinceLast += delta;
    if (emitter.SinceLast > emitter.Frequency) {
        emitter.SinceLast = 0;
        mat4_get_translation(origin, transform.World);
        mat4_get_forward(forward, transform.World);

        let room = MAX_PARTICLES - emitter.Instances.length / FLOATS_PER_PARTICLE;
        for (let i = 0; i < Math.min(emitter.Count, room); i++) {
            // Scatter the direction around the forward axis. At spread 1 the
            // forward axis is drowned out and the burst is a ball.
            direction[0] = forward[0] + float(-1, 1) * emitter.Spread;
            direction[1] = forward[1] + float(-1, 1) * emitter.Spread;
            direction[2] = forward[2] + float(-1, 1) * emitter.Spread;
            vec3_normalize(direction, direction);

            // Push [x, y, z, age] and [x, y, z, seed].
            emitter.Instances.push(...origin, 0, ...direction, Math.random());
        }
    }

    for (let i = 0; i < emitter.Instances.length; ) {
        emitter.Instances[i + 3] += delta;
        if (emitter.Instances[i + 3] > emitter.Lifespan) {
            emitter.Instances.splice(i, FLOATS_PER_PARTICLE);
        } else {
            i += FLOATS_PER_PARTICLE;
        }
    }
}
