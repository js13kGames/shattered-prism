/**
 * # sys_projectile
 *
 * Resolve what a shot hit, then destroy it.
 *
 * A slug damages exactly what it touched. A mortar shell ignores it and blasts
 * everything within its radius instead, including the player.
 */

import {instantiate} from "../../lib/game.js";
import {mat4_get_translation} from "../../lib/mat4.js";
import {Vec3} from "../../lib/math.js";
import {Entity} from "../../lib/world.js";
import {damage, hurt_player, play, splash} from "../actions.js";
import {blueprint_burst} from "../blueprints/blu_effects.js";
import {destroy_all} from "../components/com_children.js";
import {set_position} from "../components/com_transform.js";
import {Game} from "../game.js";
import {snd_hit} from "../sounds.js";
import {Has} from "../world.js";

const QUERY = Has.Projectile | Has.Collide | Has.Transform;

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
        destroy_all(game.World, entity);

        if (projectile.Splash) {
            splash(game, point, projectile.Splash, projectile.Damage, projectile.Neon);
            return;
        }

        instantiate(game, [
            ...blueprint_burst(game, projectile.Neon, 12, 6, 3),
            set_position(point[0], point[1], point[2]),
        ]);

        if (projectile.FromPlayer) {
            // damage() does nothing to a wall, which has no health; the shot
            // stops either way.
            damage(game, other, projectile.Damage);
            play(game, game.PlayerEye, snd_hit);
        } else if (other === game.PlayerEntity) {
            hurt_player(game, projectile.Damage);
        }

        return;
    }
}
