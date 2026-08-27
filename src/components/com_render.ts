/**
 * # Render
 *
 * The `Render` component allows the entity to be rendered. The game has two
 * kinds: solid geometry drawn with the one prism material, and particle bursts.
 */

import {Material} from "../../lib/material.js";
import {Vec2, Vec4} from "../../lib/math.js";
import {Mesh} from "../../lib/mesh.js";
import {GL_ARRAY_BUFFER, GL_DYNAMIC_DRAW} from "../../lib/webgl.js";
import {Entity} from "../../lib/world.js";
import {ParticlesColoredLayout, PrismLayout} from "../../materials/layout.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

export type Render = RenderPrism | RenderParticles;

export const enum RenderKind {
    Prism,
    Particles,
}

export const enum RenderPhase {
    Opaque,
    Transparent,
    /**
     * The gun in the player's hands. Drawn last, over a cleared depth buffer,
     * so that it never clips into a wall the player is standing against.
     */
    Viewmodel,
}

export interface RenderPrism {
    readonly Kind: RenderKind.Prism;
    Material: Material<PrismLayout>;
    Mesh: Mesh;
    Phase: RenderPhase;
    DiffuseColor: Vec4;
    EmissiveColor: Vec4;
    /** Skipped by the shadow pass. */
    NoShadow: boolean;
}

/**
 * Draw a mesh with the prism material.
 *
 * @param mesh The mesh to draw.
 * @param diffuse The lit colour of the surface.
 * @param emissive The unlit colour added on top; the alpha is the amount. Over
 * 1.0 the colour saturates, which is what makes the bloom pass pick it up.
 * @param phase Opaque unless this is part of the weapon in the player's hands.
 */
export function render_prism(
    mesh: Mesh,
    diffuse: Vec4,
    emissive: Vec4 = [0, 0, 0, 0],
    phase = RenderPhase.Opaque,
) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.Render;
        game.World.Render[entity] = {
            Kind: RenderKind.Prism,
            Material: game.MaterialPrism,
            Mesh: mesh,
            Phase: diffuse[3] < 1 && phase === RenderPhase.Opaque ? RenderPhase.Transparent : phase,
            DiffuseColor: diffuse,
            EmissiveColor: emissive,
            NoShadow: phase === RenderPhase.Viewmodel,
        };
    };
}

export const FLOATS_PER_PARTICLE = 8;
export const MAX_PARTICLES = 200;

export interface RenderParticles {
    readonly Kind: RenderKind.Particles;
    Material: Material<ParticlesColoredLayout>;
    Phase: RenderPhase;
    Buffer: WebGLBuffer;
    ColorStart: Vec4;
    ColorEnd: Vec4;
    Size: Vec2;
    NoShadow: true;
}

export function render_particles(
    start_color: Vec4,
    start_size: number,
    end_color: Vec4,
    end_size: number,
) {
    return (game: Game, entity: Entity) => {
        let buffer = game.Gl.createBuffer()!;
        game.Gl.bindBuffer(GL_ARRAY_BUFFER, buffer);
        game.Gl.bufferData(
            GL_ARRAY_BUFFER,
            MAX_PARTICLES * FLOATS_PER_PARTICLE * 4,
            GL_DYNAMIC_DRAW,
        );

        game.World.Signature[entity] |= Has.Render;
        game.World.Render[entity] = {
            Kind: RenderKind.Particles,
            Material: game.MaterialParticles,
            Phase: RenderPhase.Transparent,
            Buffer: buffer,
            ColorStart: start_color,
            ColorEnd: end_color,
            Size: [start_size, end_size],
            NoShadow: true,
        };
    };
}
