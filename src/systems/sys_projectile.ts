/**
 * # sys_projectile
 *
 * Resolve what a rebar hit, then destroy it.
 */

import {instantiate} from "../../lib/game.js";
import {mat4_get_translation} from "../../lib/mat4.js";
import {Vec3} from "../../lib/math.js";
import {Entity} from "../../lib/world.js";
import {damage} from "../actions.js";
import {blueprint_burst} from "../blueprints/blu_effects.js";
import {destroy_all} from "../components/com_children.js";
import {set_position} from "../components/com_transform.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.Projectile | Has.Collide | Has.Transform;
/** Sparks off concrete are white; only unicorns are allowed colour. */
const SPARKS: [number, number, number] = [1, 0.95, 0.85];

export function sys_projectile(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) === QUERY) {
            update(game, i);
        }
    }
}

let point: Vec3 = [0, 0, 0];

function update(game: Game, entity: Entity) {
    let projectile = game.World.Projectile[entity];
    let collisions = game.World.Collide[entity].Collisions;

    for (let i = 0; i < collisions.length; i++) {
        let other = collisions[i].Other;
        if (other === projectile.Owner) {
            continue;
        }

        mat4_get_translation(point, game.World.Transform[entity].World);
        instantiate(game, [
            ...blueprint_burst(game, SPARKS, 14, 6, 3),
            set_position(point[0], point[1], point[2]),
        ]);

        // damage() does nothing to a wall, which has no health; the rebar stops
        // either way.
        damage(game, other, projectile.Damage);
        destroy_all(game.World, entity);
        return;
    }
}
