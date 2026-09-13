/**
 * # sys_physics_resolve
 *
 * The second step of the physics simulation: resolve the collisions between
 * [rigid bodies](com_rigid_body.html).
 *
 * The positions of colliding rigid bodies are updated to account for the
 * collision response, i.e. the bodies are moved apart. Their velocities are
 * sawpped, too.
 */

import {Vec3} from "../../lib/math.js";
import {
    vec3_add,
    vec3_copy,
    vec3_dot,
    vec3_extend,
    vec3_normalize,
    vec3_scale,
    vec3_set,
} from "../../lib/vec3.js";
import {Entity} from "../../lib/world.js";
import {RigidKind} from "../components/com_rigid_body.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.Transform | Has.Collide | Has.RigidBody;

export function sys_physics_resolve(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) === QUERY) {
            update(game, i);
        }
    }

    // When all collisions are resolved, copy resolved velocities to
    // VelocityLinear, for other systems to use.
    for (let ent = 0; ent < game.World.Signature.length; ent++) {
        if ((game.World.Signature[ent] & QUERY) === QUERY) {
            let rigid_body = game.World.RigidBody[ent];
            if (rigid_body.Kind === RigidKind.Dynamic) {
                vec3_copy(rigid_body.VelocityLinear, rigid_body.VelocityResolved);
            }
        }
    }
}

// Temp vector used to compute the reflection off of a static body.
let a: Vec3 = [0, 0, 0];
// The combined response translation for all collisions.
let response: Vec3 = [0, 0, 0];

function update(game: Game, entity: Entity) {
    let transform = game.World.Transform[entity];
    let rigid_body = game.World.RigidBody[entity];
    let collide = game.World.Collide[entity];

    if (rigid_body.Kind === RigidKind.Dynamic) {
        rigid_body.IsGrounded = false;
        vec3_set(response, 0, 0, 0);

        for (let i = 0; i < collide.Collisions.length; i++) {
            let collision = collide.Collisions[i];
            let bounced = false;
            if (game.World.Signature[collision.Other] & Has.RigidBody) {
                // Assume mass = 1 for all rigid bodies. On collision,
                // velocities are swapped, unless the other body is a static
                // one (and behaves as if it had infinite mass).
                let other_body = game.World.RigidBody[collision.Other];
                switch (other_body.Kind) {
                    case RigidKind.Static:
                        // Extend the response vector with the collision hit,
                        // with the hit vector taking precedence. Collisions
                        // against static bodies need to be resolved first.
                        vec3_extend(response, collision.Hit, response);

                        // Split the velocity into the part along the surface
                        // normal and the part along the surface, and bounce
                        // only the first. Scaling the whole vector by
                        // Bounciness instead would mean that standing on the
                        // ground with Bounciness 0 wipes out sideways velocity
                        // every frame, and a dash would end the moment it
                        // landed.
                        vec3_normalize(a, collision.Hit);
                        let along = vec3_dot(rigid_body.VelocityLinear, a);
                        vec3_scale(a, a, -along * (1 + rigid_body.Bounciness));
                        vec3_add(rigid_body.VelocityResolved, rigid_body.VelocityLinear, a);
                        bounced = true;
                        break;
                    case RigidKind.Dynamic:
                    case RigidKind.Kinematic:
                        // Extend the response vector with the collision hit.
                        vec3_extend(response, response, collision.Hit);
                        // Swap velocities.
                        vec3_copy(rigid_body.VelocityResolved, other_body.VelocityLinear);
                        break;
                }

                if (!bounced) {
                    // Against a moving body, Bounciness still scales the whole
                    // swapped velocity.
                    vec3_scale(
                        rigid_body.VelocityResolved,
                        rigid_body.VelocityResolved,
                        rigid_body.Bounciness,
                    );
                }

                if (collision.Hit[1] > 0) {
                    // Collision from the bottom means the body is grounded.
                    rigid_body.IsGrounded = true;
                }
            }
        }

        if (response[0] || response[1] || response[2]) {
            if (Math.abs(response[0]) < 0.1) {
                // Ignore small horizontal corrections.
                response[0] = 0;
            }
            if (Math.abs(response[2]) < 0.1) {
                // Ignore small horizontal corrections.
                response[2] = 0;
            }
            // Collision response.
            vec3_add(transform.Translation, transform.Translation, response);
            game.World.Signature[entity] |= Has.Dirty;
        } else {
            // No collision; the entity's resolved velocity is its linear velocity.
            vec3_copy(rigid_body.VelocityResolved, rigid_body.VelocityLinear);
        }
    }
}
