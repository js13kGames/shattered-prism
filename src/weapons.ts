/**
 * # Weapons
 *
 * Three guns, one table. Each one is a different answer to a crowd: the rebar
 * for a single hard target, the shredder for anything close, the mortar for a
 * group or a corner you cannot see around.
 */

import {Vec3, Vec4} from "../lib/math.js";

export const enum WeaponKind {
    Rebar,
    Shredder,
    Mortar,
}

export interface Weapon {
    Name: string;
    /** Seconds between shots. */
    Interval: number;
    Damage: number;
    /** Blast radius. Zero for a solid slug. */
    Splash: number;
    /** How hard firing shoves the player back. */
    Knockback: number;
    Speed: number;
    /** Projectiles per shot. */
    Count: number;
    /** Cone half-angle, in radians. */
    Spread: number;
    /** Ammo used per shot. */
    Cost: number;
    MaxAmmo: number;
    /** Ammo a box of this type gives. */
    Box: number;
    /** Gravity multiplier on the projectile. The mortar arcs. */
    Gravity: number;
    Lifespan: number;
    /** Scale of the flying projectile. */
    Size: Vec3;
    Color: Vec4;
    Neon: [number, number, number];
    /** Camera kick when it fires. */
    Shake: number;
}

export const WEAPONS: Array<Weapon> = [
    {
        Name: "Rebar",
        Interval: 0.42,
        Damage: 46,
        Splash: 0,
        Knockback: 11,
        Speed: 78,
        Count: 1,
        Spread: 0,
        Cost: 0,
        MaxAmmo: 0,
        Box: 0,
        Gravity: 0,
        Lifespan: 2.5,
        Size: [0.12, 1.5, 0.12],
        Color: [0.5, 0.5, 0.48, 1],
        Neon: [1, 0.95, 0.85],
        Shake: 0.1,
    },
    {
        Name: "Shredder",
        Interval: 0.11,
        Damage: 13,
        Splash: 0,
        Knockback: 1.6,
        Speed: 62,
        Count: 3,
        Spread: 0.075,
        Cost: 1,
        MaxAmmo: 220,
        Box: 45,
        Gravity: 0,
        Lifespan: 1.4,
        Size: [0.07, 0.55, 0.07],
        Color: [0.62, 0.6, 0.5, 1],
        Neon: [1, 0.8, 0.35],
        Shake: 0.05,
    },
    {
        Name: "Mortar",
        Interval: 0.85,
        Damage: 58,
        Splash: 6.5,
        Knockback: 15,
        Speed: 34,
        Count: 1,
        Spread: 0,
        Cost: 1,
        MaxAmmo: 40,
        Box: 6,
        Gravity: 1,
        Lifespan: 5,
        Size: [0.34, 0.34, 0.34],
        Color: [0.2, 0.2, 0.22, 1],
        Neon: [0.4, 1, 0.7],
        Shake: 0.22,
    },
];

/** The rebar never runs out; the other two do. */
export const STARTING_AMMO = [0, 90, 10];
