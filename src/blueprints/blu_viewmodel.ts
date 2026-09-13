/**
 * # Viewmodels
 *
 * The gun in your hands, built from the same two prisms as everything else.
 *
 * Each model is authored in camera space: -Z is forward, so the barrel runs
 * along -Z, and the whole thing sits low and to the right. It is drawn in the
 * viewmodel phase, over a cleared depth buffer, so it never clips into a wall.
 */

import {Vec4} from "../../lib/math.js";
import {children} from "../components/com_children.js";
import {render_prism, RenderPhase} from "../components/com_render.js";
import {transform} from "../components/com_transform.js";
import {WeaponKind} from "../weapons.js";

const STEEL: Vec4 = [0.29, 0.3, 0.33, 1];
const DARK: Vec4 = [0.13, 0.13, 0.15, 1];
const GRIP: Vec4 = [0.18, 0.15, 0.13, 1];
const NONE: Vec4 = [0, 0, 0, 0];

/** A lit part of the gun, in the colour of the ammo it fires. */
function glow(rgb: [number, number, number], amount = 1.3): Vec4 {
    return [...rgb, amount];
}

function part(
    position: [number, number, number],
    scale: [number, number, number],
    color: Vec4,
    emissive: Vec4 = NONE,
    cylinder = false,
    rotation?: [number, number, number, number],
) {
    return [
        transform(position, rotation, scale),
        render_prism(color, emissive, cylinder, RenderPhase.Viewmodel),
    ];
}

/**
 * The models are authored at roughly world scale so the proportions are easy to
 * reason about, then shrunk to fit the lens. A gun modelled full size and held
 * where a gun is held fills half the screen.
 */
const MODEL_SCALE: [number, number, number] = [0.42, 0.42, 0.42];

/** Lie a cylinder down so that its long axis runs along Z instead of Y. */
const LAY: [number, number, number, number] = [0.7071, 0, 0, 0.7071];

export function blueprint_viewmodel(kind: WeaponKind) {
    if (kind === WeaponKind.Shredder) {
        return [
            transform(undefined, undefined, MODEL_SCALE),
            children(
                // Receiver.
                part([0, 0, -0.34], [0.12, 0.13, 0.5], STEEL),
                // Three barrels in a bundle.
                part([-0.05, 0.03, -0.72], [0.045, 0.5, 0.045], DARK, NONE, true, LAY),
                part([0.05, 0.03, -0.72], [0.045, 0.5, 0.045], DARK, NONE, true, LAY),
                part([0, -0.05, -0.72], [0.045, 0.5, 0.045], DARK, NONE, true, LAY),
                // Drum magazine.
                part([0, -0.11, -0.28], [0.2, 0.1, 0.2], DARK, NONE, true),
                // Grip.
                part([0, -0.14, -0.12], [0.08, 0.2, 0.09], GRIP),
                // Heat glow between the barrels.
                part([0, 0, -0.5], [0.05, 0.05, 0.16], DARK, glow([1, 0.8, 0.35], 1.1)),
            ),
        ];
    }

    if (kind === WeaponKind.Mortar) {
        return [
            transform(undefined, undefined, MODEL_SCALE),
            children(
                // Fat tube.
                part([0, 0.02, -0.5], [0.19, 0.8, 0.19], STEEL, NONE, true, LAY),
                // Muzzle ring.
                part([0, 0.02, -0.88], [0.24, 0.08, 0.24], DARK, NONE, true, LAY),
                // Body block under the tube.
                part([0, -0.12, -0.3], [0.17, 0.14, 0.34], DARK),
                // Shell in the loading port, glowing.
                part([0, -0.14, -0.06], [0.11, 0.11, 0.11], DARK, glow([0.4, 1, 0.7], 1.2)),
                // Grip and brace.
                part([0, -0.2, -0.16], [0.09, 0.22, 0.1], GRIP),
                part([0, 0.14, -0.32], [0.05, 0.1, 0.24], DARK),
            ),
        ];
    }

    // The rebar gun: a length of scaffolding with a slug in it.
    return [
        transform(undefined, undefined, MODEL_SCALE),
        children(
            // Square barrel.
            part([0, 0, -0.6], [0.11, 0.11, 0.75], STEEL),
            // Muzzle brace.
            part([0, 0, -0.98], [0.17, 0.17, 0.07], DARK),
            // The rebar itself, sticking out of the barrel.
            part([0, 0, -1.12], [0.05, 0.34, 0.05], [0.5, 0.5, 0.48, 1], NONE, true, LAY),
            // Breech and grip.
            part([0, -0.03, -0.2], [0.16, 0.17, 0.3], DARK),
            part([0, -0.19, -0.14], [0.08, 0.22, 0.1], GRIP),
            // Charge coil, glowing white-hot.
            part([0, 0.08, -0.36], [0.06, 0.06, 0.14], DARK, glow([1, 0.95, 0.85], 0.9)),
        ),
    ];
}
