/**
 * # sys_control_ai
 *
 * Point every unicorn at the player and let it run.
 *
 * There is no pathfinding. The arena is open, the props are shootable, and a
 * unicorn that gets stuck on one is a unicorn the player can walk away from.
 */

import {mat4_get_translation} from "../../lib/mat4.js";
import {Vec3} from "../../lib/math.js";
import {quat_from_euler} from "../../lib/quat.js";
import {Entity} from "../../lib/world.js";
import {hurt_player, play} from "../actions.js";
import {destroy_all} from "../components/com_children.js";
import {AiKind} from "../components/com_gameplay.js";
import {VOID_LEVEL} from "./sys_control_move_tech.js";
import {Game} from "../game.js";
import {snd_neigh} from "../sounds.js";
import {Has} from "../world.js";

const QUERY = Has.ControlAi | Has.Transform | Has.Move | Has.RigidBody;

/** How close a unicorn has to be to bite. */
const REACH = 2.6;
const BITE_DAMAGE = 9;
const BITE_INTERVAL = 1.3;
const LEAP_RANGE = 16;
const LEAP_SPEED = 19;
const LEAP_LIFT = 11;
const LEAP_INTERVAL = 2.6;
/** Chance per second that a unicorn makes a noise. */
const NEIGH_RATE = 0.12;

export function sys_control_ai(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) === QUERY) {
            update(game, i, delta);
        }
    }
}

let self_position: Vec3 = [0, 0, 0];
let player_position: Vec3 = [0, 0, 0];

function update(game: Game, entity: Entity, delta: number) {
    let ai = game.World.ControlAi[entity];
    let transform = game.World.Transform[entity];
    let move = game.World.Move[entity];
    let body = game.World.RigidBody[entity];

    ai.Cooldown -= delta;

    mat4_get_translation(self_position, transform.World);

    if (self_position[1] < VOID_LEVEL) {
        // Count it as killed. A unicorn lost under the arena would otherwise
        // keep the wave open for ever.
        destroy_all(game.World, entity);
        game.Alive--;
        return;
    }

    mat4_get_translation(player_position, game.World.Transform[game.PlayerEntity].World);

    let dx = player_position[0] - self_position[0];
    let dz = player_position[2] - self_position[2];
    let distance = Math.hypot(dx, dz);

    // Face the player. The mesh looks down its own +Z, which is also the axis
    // sys_move walks along, so aiming and walking are the same rotation.
    quat_from_euler(transform.Rotation, 0, (Math.atan2(dx, dz) * 180) / Math.PI, 0);
    game.World.Signature[entity] |= Has.Dirty;

    if (ai.Kind === AiKind.Leaper && distance < LEAP_RANGE) {
        // Leapers hang back and cover the gap in one jump.
        if (ai.Cooldown <= 0 && body.IsGrounded) {
            ai.Cooldown = LEAP_INTERVAL;
            body.VelocityLinear[0] = (dx / distance) * LEAP_SPEED;
            body.VelocityLinear[1] = LEAP_LIFT;
            body.VelocityLinear[2] = (dz / distance) * LEAP_SPEED;
            play(game, entity, snd_neigh);
        }
    } else {
        move.Direction[2] += 1;
    }

    if (distance < REACH && ai.Cooldown <= 0) {
        ai.Cooldown = BITE_INTERVAL;
        hurt_player(game, BITE_DAMAGE);
        play(game, entity, snd_neigh);
    } else if (Math.random() < NEIGH_RATE * delta) {
        play(game, entity, snd_neigh);
    }
}
