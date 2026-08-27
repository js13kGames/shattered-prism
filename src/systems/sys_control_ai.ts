/**
 * # sys_control_ai
 *
 * Three states, and one question that moves between them: can it see you?
 *
 * On **patrol** an enemy walks its fixed route and ignores you. The moment the
 * line of sight is clear it **engages** — charges, or stops and shoots. When it
 * loses sight it **searches** the place it last saw you, and then goes back to
 * its route.
 *
 * The sight test is a ray against the level's static boxes, so a wall really
 * does hide you. It runs a few times a second per enemy, staggered, rather than
 * every frame.
 */

import {ray_aabb} from "../../lib/aabb.js";
import {instantiate} from "../../lib/game.js";
import {mat4_get_translation} from "../../lib/mat4.js";
import {Vec3} from "../../lib/math.js";
import {quat_from_euler} from "../../lib/quat.js";
import {float} from "../../lib/random.js";
import {vec3_copy} from "../../lib/vec3.js";
import {Entity} from "../../lib/world.js";
import {hurt_player, play} from "../actions.js";
import {blueprint_bolt} from "../blueprints/blu_effects.js";
import {STATS} from "../blueprints/blu_enemies.js";
import {AiState} from "../components/com_gameplay.js";
import {set_position} from "../components/com_transform.js";
import {Game, Layer} from "../game.js";
import {EnemyKind} from "../map.js";
import {snd_bolt, snd_neigh} from "../sounds.js";
import {Has} from "../world.js";
import {VOID_LEVEL} from "./sys_control_move_tech.js";

const QUERY = Has.ControlAi | Has.Transform | Has.Move | Has.RigidBody;
const SIGHT_QUERY = Has.Collide | Has.Transform;

/** How close counts as having reached a route node. */
const ARRIVED = 2.5;
/** How long an enemy keeps looking after losing sight. */
const PATIENCE = 5;
/** The range a gunner tries to hold. */
const GUNNER_STANDOFF = 14;
const BOLT_SPEED = 42;
/** Chance per second that an idle enemy makes a noise. */
const NEIGH_RATE = 0.1;

export function sys_control_ai(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) === QUERY) {
            update(game, i, delta);
        }
    }
}

let self_position: Vec3 = [0, 0, 0];
let player_position: Vec3 = [0, 0, 0];
let target: Vec3 = [0, 0, 0];

function update(game: Game, entity: Entity, delta: number) {
    let ai = game.World.ControlAi[entity];
    let transform = game.World.Transform[entity];
    let move = game.World.Move[entity];
    let body = game.World.RigidBody[entity];
    let stats = STATS[ai.Kind];

    ai.Cooldown -= delta;
    ai.Think -= delta;

    mat4_get_translation(self_position, transform.World);

    if (self_position[1] < VOID_LEVEL) {
        // It walked off something it should not have. Put it back on its post
        // rather than deleting it: a level that quietly loses its enemies is
        // worse than one that recycles them.
        transform.Translation[0] = ai.Route[0][0];
        transform.Translation[1] = ai.Route[0][1];
        transform.Translation[2] = ai.Route[0][2];
        body.VelocityLinear[0] = body.VelocityLinear[1] = body.VelocityLinear[2] = 0;
        ai.State = AiState.Patrol;
        game.World.Signature[entity] |= Has.Dirty;
        return;
    }

    mat4_get_translation(player_position, game.World.Transform[game.PlayerEye].World);
    let distance = Math.hypot(
        player_position[0] - self_position[0],
        player_position[2] - self_position[2],
    );

    if (ai.Think <= 0) {
        // Stagger the tests so that the whole level does not think on one frame.
        ai.Think = float(0.2, 0.35);

        if (distance < stats.Sight && can_see(game, self_position, player_position)) {
            if (ai.State === AiState.Patrol) {
                play(game, entity, snd_neigh);
            }
            ai.State = AiState.Engage;
            ai.Patience = PATIENCE;
            vec3_copy(ai.Mark, player_position);
        } else if (ai.State === AiState.Engage) {
            ai.State = AiState.Search;
        }
    }

    if (ai.State === AiState.Engage) {
        vec3_copy(target, player_position);
    } else if (ai.State === AiState.Search) {
        vec3_copy(target, ai.Mark);
        ai.Patience -= delta;
        let to_mark = Math.hypot(ai.Mark[0] - self_position[0], ai.Mark[2] - self_position[2]);
        if (ai.Patience <= 0 || to_mark < ARRIVED) {
            ai.State = AiState.Patrol;
        }
    } else {
        vec3_copy(target, ai.Route[ai.Node]);
        let to_node = Math.hypot(target[0] - self_position[0], target[2] - self_position[2]);
        if (to_node < ARRIVED) {
            ai.Node = (ai.Node + 1) % ai.Route.length;
        }
    }

    let dx = target[0] - self_position[0];
    let dz = target[2] - self_position[2];

    // Face the target. The mesh looks down its own +Z, which is also the axis
    // sys_move walks along, so aiming and walking are the same rotation.
    if (Math.hypot(dx, dz) > 0.01) {
        quat_from_euler(transform.Rotation, 0, (Math.atan2(dx, dz) * 180) / Math.PI, 0);
        game.World.Signature[entity] |= Has.Dirty;
    }

    if (ai.Kind === EnemyKind.Gunner && ai.State === AiState.Engage) {
        // Hold the line: close if far, back off if crowded, and strafe either
        // way so that it is never a stationary target.
        if (distance > GUNNER_STANDOFF + 3) {
            move.Direction[2] += 1;
        } else if (distance < GUNNER_STANDOFF - 3) {
            move.Direction[2] -= 1;
        }
        move.Direction[0] += Math.sin(game.Now / 900 + entity) * 0.8;

        if (ai.Cooldown <= 0 && distance < stats.Reach) {
            ai.Cooldown = stats.Interval;
            shoot(game, entity, ai.Neon, stats.Damage);
        }
        return;
    }

    // Everything else closes and gores. An enemy holding a single-node post
    // stays put until it sees you.
    if (ai.State !== AiState.Patrol || ai.Route.length > 1) {
        move.Direction[2] += 1;
    }

    if (ai.State === AiState.Engage && distance < stats.Reach && ai.Cooldown <= 0) {
        ai.Cooldown = stats.Interval;
        hurt_player(game, stats.Damage);
        play(game, entity, snd_neigh);
    } else if (ai.Kind === EnemyKind.Hound && ai.State === AiState.Engage && body.IsGrounded) {
        // Hounds do not run in a straight line; they bound.
        if (Math.random() < delta * 0.9) {
            body.VelocityLinear[1] = 7;
        }
    } else if (Math.random() < NEIGH_RATE * delta) {
        play(game, entity, snd_neigh);
    }
}

let origin: Vec3 = [0, 0, 0];
let inverse: Vec3 = [0, 0, 0];

/**
 * Is the line between two points clear of level geometry?
 *
 * Only static Terrain colliders block sight. Crates and other enemies do not:
 * an enemy that lost track of you because a colleague walked past would read as
 * broken rather than as clever.
 */
function can_see(game: Game, from: Vec3, to: Vec3) {
    // Look from the top of the body, so a low ledge does not blind it.
    origin[0] = from[0];
    origin[1] = from[1] + 0.6;
    origin[2] = from[2];

    let dx = to[0] - origin[0];
    let dy = to[1] - origin[1];
    let dz = to[2] - origin[2];
    let distance = Math.hypot(dx, dy, dz);
    if (distance < 0.01) {
        return true;
    }

    // The reciprocal of the direction, scaled so that the slab test reports
    // distances in world units. A zero component would divide by zero; a huge
    // reciprocal gives the same answer for a ray parallel to that slab.
    inverse[0] = distance / (dx || 1e-6);
    inverse[1] = distance / (dy || 1e-6);
    inverse[2] = distance / (dz || 1e-6);

    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & SIGHT_QUERY) === SIGHT_QUERY) {
            let collide = game.World.Collide[i];
            if (collide.Dynamic || !(collide.Layers & Layer.Terrain)) {
                continue;
            }
            let hit = ray_aabb(origin, inverse, collide);
            if (hit >= 0 && hit < distance) {
                return false;
            }
        }
    }

    return true;
}

function shoot(game: Game, entity: Entity, neon: [number, number, number], damage: number) {
    let dx = player_position[0] - self_position[0];
    let dy = player_position[1] - (self_position[1] + 0.6);
    let dz = player_position[2] - self_position[2];
    let length = Math.hypot(dx, dy, dz) || 1;

    let bolt = instantiate(game, [
        ...blueprint_bolt(game, entity, damage, neon),
        set_position(
            self_position[0] + (dx / length) * 1.8,
            self_position[1] + 0.6 + (dy / length) * 1.8,
            self_position[2] + (dz / length) * 1.8,
        ),
    ]);

    let body = game.World.RigidBody[bolt];
    body.VelocityLinear[0] = (dx / length) * BOLT_SPEED;
    body.VelocityLinear[1] = (dy / length) * BOLT_SPEED;
    body.VelocityLinear[2] = (dz / length) * BOLT_SPEED;

    play(game, entity, snd_bolt);
}
