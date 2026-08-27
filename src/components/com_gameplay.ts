/**
 * # Gameplay components
 *
 * The components the game adds on top of the template. Each is a handful of
 * fields, so they share one file rather than a dozen near-empty ones.
 */

import {Vec3} from "../../lib/math.js";
import {Entity} from "../../lib/world.js";
import {EnemyKind} from "../map.js";
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

export const enum AiState {
    /** Walking the route, unaware. */
    Patrol,
    /** Has seen the player and is closing in or shooting. */
    Engage,
    /** Lost sight; heads for where the player was, then gives up. */
    Search,
}

export interface ControlAi {
    Kind: EnemyKind;
    State: AiState;
    /** Route in world space. A one-node route means the enemy holds position. */
    Route: Array<Vec3>;
    Node: number;
    /** Time until the next shot or gore. */
    Cooldown: number;
    /** Time until the next line-of-sight test. Staggered, so they do not all think at once. */
    Think: number;
    /** Time left searching before going back on patrol. */
    Patience: number;
    /** Where the player was when last seen. */
    Mark: Vec3;
    /** This enemy's neon, reused by its death burst. */
    Neon: [number, number, number];
}

export function control_ai(kind: EnemyKind, route: Array<Vec3>, neon: [number, number, number]) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.ControlAi;
        game.World.ControlAi[entity] = {
            Kind: kind,
            State: AiState.Patrol,
            Route: route,
            Node: 0,
            Cooldown: 1,
            Think: Math.random() * 0.3,
            Patience: 0,
            Mark: [0, 0, 0],
            Neon: neon,
        };
    };
}

export interface Projectile {
    Damage: number;
    /** Blast radius. Zero for a solid slug. */
    Splash: number;
    /** The entity that fired it, so a shot never hits its owner. */
    Owner: Entity;
    /** Whether the player or an enemy fired it. */
    FromPlayer: boolean;
    Neon: [number, number, number];
}

export function projectile(
    damage: number,
    splash: number,
    owner: Entity,
    from_player: boolean,
    neon: [number, number, number],
) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.Projectile;
        game.World.Projectile[entity] = {
            Damage: damage,
            Splash: splash,
            Owner: owner,
            FromPlayer: from_player,
            Neon: neon,
        };
    };
}

export interface Shatter {
    /** 0 = intact crate, 1 = chunk, 2 = rubble. Rubble does not shatter again. */
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
    Ammo: number;
    /** Which weapon the ammo is for. Ignored when Ammo is 0. */
    Weapon: number;
}

export function pickup(heal: number, ammo = 0, weapon = 0) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.Pickup;
        game.World.Pickup[entity] = {Heal: heal, Ammo: ammo, Weapon: weapon};
    };
}

export const enum TriggerKind {
    Pad,
    Exit,
}

export interface Trigger {
    Kind: TriggerKind;
    /** The velocity a pad throws you at. */
    Boost: Vec3;
}

export function trigger(kind: TriggerKind, boost: Vec3 = [0, 0, 0]) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.Trigger;
        game.World.Trigger[entity] = {Kind: kind, Boost: boost};
    };
}

export interface Platform {
    LowY: number;
    HighY: number;
    Speed: number;
    /** The Y the lift is travelling towards. */
    TargetY: number;
    /** Time to wait at the top before coming back down. */
    Wait: number;
}

export function platform(low: number, high: number, speed = 3.5) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.Platform;
        game.World.Platform[entity] = {
            LowY: low,
            HighY: high,
            Speed: speed,
            TargetY: low,
            Wait: 0,
        };
    };
}
