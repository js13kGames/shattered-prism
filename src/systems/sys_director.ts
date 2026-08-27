/**
 * # sys_director
 *
 * Run the waves: count down between them, then put a ring of unicorns around
 * the arena and let them come in.
 */

import {instantiate} from "../../lib/game.js";
import {float, integer} from "../../lib/random.js";
import {blueprint_unicorn, NEON, UNICORN_HEIGHT} from "../blueprints/blu_unicorn.js";
import {AiKind} from "../components/com_gameplay.js";
import {set_position} from "../components/com_transform.js";
import {Game} from "../game.js";
import {ARENA_RADIUS} from "../scenes/sce_arena.js";

/** Pause between waves, in seconds. */
const BREATHER = 4;
/** Leapers only start showing up once the player knows the walkers. */
const LEAPER_WAVE = 3;

export function sys_director(game: Game, delta: number) {
    if (game.Alive > 0) {
        return;
    }

    game.Countdown -= delta;
    if (game.Countdown > 0) {
        return;
    }

    game.Wave++;
    game.Countdown = BREATHER;
    game.Alive = wave_size(game.Wave);

    // Spread the wave evenly around the ring, then jitter it, so that the
    // player cannot learn one safe corner.
    for (let i = 0; i < game.Alive; i++) {
        let angle = (i / game.Alive) * 2 * Math.PI + float(-0.3, 0.3);
        let radius = ARENA_RADIUS - float(4, 10);
        let kind =
            game.Wave >= LEAPER_WAVE && integer(0, 3) === 0 ? AiKind.Leaper : AiKind.Walker;

        instantiate(game, [
            ...blueprint_unicorn(game, kind, NEON[integer(0, NEON.length - 1)]),
            set_position(Math.cos(angle) * radius, UNICORN_HEIGHT, Math.sin(angle) * radius),
        ]);
    }
}

/** Grows fast at first, then keeps climbing, and is capped so the frame is not. */
export function wave_size(wave: number) {
    return Math.min(3 + wave * 2, 26);
}
