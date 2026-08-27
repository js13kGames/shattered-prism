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
}

export interface RenderPrism {
    readonly Kind: RenderKind.Prism;
    Material: Material<PrismLayout>;
    Mesh: Mesh;
    Phase: RenderPhase;
    DiffuseColor: Vec4;
    EmissiveColor: Vec4;
}

/**
 * Draw a mesh with the prism material.
 *
 * @param mesh The mesh to draw.
 * @param diffuse The lit color of the surface.
 * @param emissive The unlit color added on top; the alpha is the amount. Over
 * 1.0 the color saturates, which is what makes the bloom pass pick it up.
 */
export function render_prism(mesh: Mesh, diffuse: Vec4, emissive: Vec4 = [0, 0, 0, 0]) {
    return (game: Game, entity: Entity) => {
        game.World.Signature[entity] |= Has.Render;
        game.World.Render[entity] = {
            Kind: RenderKind.Prism,
            Material: game.MaterialPrism,
            Mesh: mesh,
            Phase: diffuse[3] < 1 ? RenderPhase.Transparent : RenderPhase.Opaque,
            DiffuseColor: diffuse,
            EmissiveColor: emissive,
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
        };
    };
}
