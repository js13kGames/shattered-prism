/**
 * # RigidBody
 *
 * The `RigidBody` component allows the entity to collide and interact with
 * other rigid bodies
 *
 * The physics simulation is simplified. Among others, it assumes mass = 1,
 * which means that acceleration and force are numerically equal.
 */

import {Vec3} from "../../lib/math.js";
import {Entity} from "../../lib/world.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

export const enum RigidKind {
    Static,
    Dynamic,
    Kinematic,
}

export interface RigidBody {
    Kind: RigidKind;
    Bounciness: number;
    VelocityLinear: Vec3;
    VelocityResolved: Vec3;
    IsGrounded: boolean;
    /** How fast horizontal velocity bleeds off while grounded. */
    Friction: number;
    /** Multiplier on gravity. Rebars fly flat, so theirs is 0. */
    Gravity: number;
}

/**
 * Add `RigidBody` to an entity.
 *
 * @param kind The type of the rigid body (static, dynamic, kinematic).
 * @param bounciness Bounciness of the rigid body (0 = no bounce, 1 = full bounce).
 * @param friction How fast horizontal velocity bleeds off on the ground.
 */
export function rigid_body(kind: RigidKind, bounciness = 0.5, friction = 9, gravity = 1) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.RigidBody;
        game.World.RigidBody[entity] = {
            Kind: kind,
            Bounciness: bounciness,
            VelocityLinear: [0, 0, 0],
            VelocityResolved: [0, 0, 0],
            IsGrounded: false,
            Friction: friction,
            Gravity: gravity,
        };
    };
}
