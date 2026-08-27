/**
 * # sys_touch
 *
 * Everything that happens because the player walked into it: pickups, jump
 * pads, and the way out.
 *
 * All three are the same query over the player's collisions, so they share one
 * system rather than three near-identical loops.
 */

import {destroy_all} from "../components/com_children.js";
import {TriggerKind} from "../components/com_gameplay.js";
import {collect, escape, play, shake_camera} from "../actions.js";
import {Game} from "../game.js";
import {snd_pad} from "../sounds.js";
import {Has} from "../world.js";

const QUERY = Has.ControlPlayer | Has.Collide | Has.RigidBody;

export function sys_touch(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) === QUERY) {
            update(game, i);
        }
    }
}

function update(game: Game, entity: Game["PlayerEntity"]) {
    let collisions = game.World.Collide[entity].Collisions;

    for (let i = 0; i < collisions.length; i++) {
        let other = collisions[i].Other;
        let signature = game.World.Signature[other];

        if (signature & Has.Pickup) {
            if (collect(game, game.World.Pickup[other])) {
                destroy_all(game.World, other);
            }
            continue;
        }

        if (signature & Has.Trigger) {
            let trigger = game.World.Trigger[other];
            if (trigger.Kind === TriggerKind.Exit) {
                escape(game);
                return;
            }

            // A pad overwrites the velocity rather than adding to it, so it
            // throws you the same distance however fast you ran onto it.
            let body = game.World.RigidBody[entity];
            body.VelocityLinear[0] = trigger.Boost[0];
            body.VelocityLinear[1] = trigger.Boost[1];
            body.VelocityLinear[2] = trigger.Boost[2];
            play(game, entity, snd_pad);
            shake_camera(game, 0.1);
        }
    }
}
