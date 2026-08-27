/**
 * # sys_physics_integrate
 *
 * The first step of the physics simulation: integrate the [rigid
 * body](com_rigid_body.html)'s acceleration and velocity into the entity's
 * transform.
 *
 * The order the rest of the simulation needs is
 * integrate -> transform -> collide -> resolve -> transform.
 */

import {Vec3} from "../../lib/math.js";
import {vec3_add, vec3_scale, vec3_set} from "../../lib/vec3.js";
import {Entity} from "../../lib/world.js";
import {RigidKind} from "../components/com_rigid_body.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.Transform | Has.RigidBody;
/** Heavier than earth. Quake-feel comes from the numbers, not from new code. */
const GRAVITY = -26;

export function sys_physics_integrate(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) === QUERY) {
            update(game, i, delta);
        }
    }
}

const velocity_delta: Vec3 = [0, 0, 0];

function update(game: Game, entity: Entity, delta: number) {
    let transform = game.World.Transform[entity];
    let rigid_body = game.World.RigidBody[entity];

    if (rigid_body.Kind !== RigidKind.Dynamic) {
        return;
    }

    rigid_body.VelocityLinear[1] += GRAVITY * rigid_body.Gravity * delta;

    vec3_scale(rigid_body.Acceleration, rigid_body.Acceleration, delta);
    vec3_add(rigid_body.VelocityLinear, rigid_body.VelocityLinear, rigid_body.Acceleration);

    // Ground friction. Without it nothing that gets a push ever stops, because
    // walking is positional and never touches the velocity.
    if (rigid_body.IsGrounded && rigid_body.Friction > 0) {
        let keep = Math.max(0, 1 - rigid_body.Friction * delta);
        rigid_body.VelocityLinear[0] *= keep;
        rigid_body.VelocityLinear[2] *= keep;
    }

    vec3_scale(velocity_delta, rigid_body.VelocityLinear, delta);
    vec3_add(transform.Translation, transform.Translation, velocity_delta);
    game.World.Signature[entity] |= Has.Dirty;

    vec3_set(rigid_body.Acceleration, 0, 0, 0);
}
