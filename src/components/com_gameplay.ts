/**
 * # Gameplay components
 *
 * The five components the game adds on top of the template. Each is a handful
 * of numbers, so they share one file rather than five near-empty ones.
 */

import {Entity} from "../../lib/world.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

export interface Health {
    Current: number;
    Max: number;
}

export function health(max: number) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.Health;
        game.World.Health[entity] = {Current: max, Max: max};
    };
}

export const enum AiKind {
    /** Runs at the player and bites. */
    Walker,
    /** Hangs back, then leaps in a long arc. */
    Leaper,
}

export interface ControlAi {
    Kind: AiKind;
    /** Time until this unicorn may attack or leap again. */
    Cooldown: number;
    /** Colour of this unicorn's neon, reused by its death burst. */
    Neon: [number, number, number];
}

export function control_ai(kind: AiKind, neon: [number, number, number]) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.ControlAi;
        game.World.ControlAi[entity] = {Kind: kind, Cooldown: 1, Neon: neon};
    };
}

export interface Projectile {
    Damage: number;
    /** Entity that fired it, so that rebars do not hit their owner. */
    Owner: Entity;
}

export function projectile(damage: number, owner: Entity) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.Projectile;
        game.World.Projectile[entity] = {Damage: damage, Owner: owner};
    };
}

export interface Shatter {
    /** 0 = intact prop, 1 = chunk, 2 = rubble. Rubble does not shatter again. */
    Generation: number;
}

export function shatter(generation: number) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.Shatter;
        game.World.Shatter[entity] = {Generation: generation};
    };
}

export interface Pickup {
    Heal: number;
}

export function pickup(heal: number) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.Pickup;
        game.World.Pickup[entity] = {Heal: heal};
    };
}
