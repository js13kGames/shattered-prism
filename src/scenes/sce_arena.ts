import {instantiate} from "../../lib/game.js";
import {float, integer, set_seed} from "../../lib/random.js";
import {blueprint_prop, blueprint_wall} from "../blueprints/blu_arena.js";
import {blueprint_player} from "../blueprints/blu_player.js";
import {light_directional} from "../components/com_light.js";
import {set_position, set_rotation, set_scale, transform} from "../components/com_transform.js";
import {Game} from "../game.js";
import {World} from "../world.js";

/** The arena is a circle of this radius inside a square box. */
export const ARENA_RADIUS = 45;
const WALL_HEIGHT = 16;
const FLOOR_DEPTH = 40;
const PROP_COUNT = 30;

/**
 * Build the arena. A scene is a fresh `World`, which is also the whole restart
 * mechanism: there is nothing cheaper to reset than a new object.
 */
export function scene_arena(game: Game) {
    game.World = new World();
    game.ViewportResized = true;
    game.Wave = 0;
    game.Alive = 0;
    game.Countdown = 3;
    game.Kills = 0;

    // A new arena every run.
    set_seed(Date.now() % 100000);

    // Floor. It is deliberately a very deep slab: AABB collisions resolve on
    // the axis of least penetration, and a thin floor lets a body that is
    // squeezed out of the bottom of a prop pop out underneath the world.
    instantiate(game, [
        ...blueprint_wall(game),
        set_position(0, -FLOOR_DEPTH / 2, 0),
        set_scale(ARENA_RADIUS * 2.2, FLOOR_DEPTH, ARENA_RADIUS * 2.2),
    ]);

    // Four slabs boxing the arena in. The megastructure has no way out.
    let span = ARENA_RADIUS * 1.1;
    for (let i = 0; i < 4; i++) {
        let angle = (i / 4) * 2 * Math.PI;
        instantiate(game, [
            ...blueprint_wall(game),
            set_position(Math.cos(angle) * span, WALL_HEIGHT / 2 - 1, Math.sin(angle) * span),
            // A slab standing at +X has to be thin on X and long on Z.
            set_scale(i % 2 ? span * 2.2 : 4, WALL_HEIGHT, i % 2 ? 4 : span * 2.2),
        ]);
    }

    // Brutalist cover: cubes and cylinders, no two the same, none of them near
    // enough to the middle to trap the player at the start.
    for (let i = 0; i < PROP_COUNT; i++) {
        let angle = float(0, 2 * Math.PI);
        let radius = float(9, ARENA_RADIUS - 6);
        let cylinder = integer(0, 2) === 0;
        let height = float(3, 11);
        let width = cylinder ? float(2, 4.5) : float(2.5, 7);

        instantiate(game, [
            ...blueprint_prop(game, cylinder ? game.MeshCylinder : game.MeshCube, 0),
            set_position(Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius),
            set_scale(width, height, cylinder ? width : float(2.5, 7)),
        ]);
    }

    // One cold key light. Everything else in the sky is dead.
    instantiate(game, [transform(), set_rotation(-60, 35, 0), light_directional([0.7, 0.75, 1], 1.1)]);

    let player = instantiate(game, [...blueprint_player(game), set_position(0, 2, 0)]);
    game.PlayerEntity = player;
    game.PlayerEye = game.World.Children[player].Children[0];
    game.PlayerCamera = game.World.Children[game.PlayerEye].Children[0];
}
