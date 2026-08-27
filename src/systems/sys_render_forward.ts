/**
 * # sys_render_forward
 *
 * Render the world into the camera's 320x240 target. Only two kinds of
 * renderables exist: prisms, drawn with the one world material, and particles.
 */

import {Material} from "../../lib/material.js";
import {
    GL_ARRAY_BUFFER,
    GL_BLEND,
    GL_FLOAT,
    GL_FRAMEBUFFER,
    GL_UNSIGNED_SHORT,
} from "../../lib/webgl.js";
import {Entity} from "../../lib/world.js";
import {CameraEye, CameraKind} from "../components/com_camera.js";
import {FLOATS_PER_PARTICLE, Render, RenderKind, RenderPhase} from "../components/com_render.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.Transform | Has.Render;

export function sys_render_forward(game: Game, delta: number) {
    for (let camera_entity of game.Cameras) {
        let camera = game.World.Camera[camera_entity];
        if (camera.Kind === CameraKind.Target) {
            game.Gl.bindFramebuffer(GL_FRAMEBUFFER, camera.Target.Framebuffer);
            game.Gl.viewport(0, 0, camera.Target.Width, camera.Target.Height);
            game.Gl.clearColor(...camera.ClearColor);
            game.Gl.clear(camera.ClearMask);
            render_all(game, camera);
        }
    }
}

function render_all(game: Game, eye: CameraEye) {
    let current_material: Material<unknown> | null = null;
    let transparent: Array<Entity> = [];

    for (let ent = 0; ent < game.World.Signature.length; ent++) {
        if ((game.World.Signature[ent] & QUERY) === QUERY) {
            let render = game.World.Render[ent];
            if (render.Phase === RenderPhase.Transparent) {
                transparent.push(ent);
                continue;
            }
            if (render.Material !== current_material) {
                current_material = render.Material;
                use_material(game, render, eye);
            }
            draw_entity(game, ent);
        }
    }

    // Particles are additive-ish and always drawn last. They are unsorted:
    // every burst is a cloud of the same neon, so overlap order does not read.
    game.Gl.enable(GL_BLEND);
    for (let i = 0; i < transparent.length; i++) {
        let render = game.World.Render[transparent[i]];
        if (render.Material !== current_material) {
            current_material = render.Material;
            use_material(game, render, eye);
        }
        draw_entity(game, transparent[i]);
    }
    game.Gl.disable(GL_BLEND);
}

function use_material(game: Game, render: Render, eye: CameraEye) {
    game.Gl.useProgram(render.Material.Program);
    game.Gl.uniformMatrix4fv(render.Material.Locations.Pv, false, eye.Pv);

    if (render.Kind === RenderKind.Prism) {
        game.Gl.uniform3fv(render.Material.Locations.Eye, eye.Position);
        game.Gl.uniform4fv(render.Material.Locations.LightPositions, game.LightPositions);
        game.Gl.uniform4fv(render.Material.Locations.LightDetails, game.LightDetails);
        game.Gl.uniform4fv(render.Material.Locations.FogColor, eye.FogColor);
        game.Gl.uniform1f(render.Material.Locations.FogDistance, eye.FogDistance);
    }
}

function draw_entity(game: Game, entity: Entity) {
    let transform = game.World.Transform[entity];
    let render = game.World.Render[entity];

    if (render.Kind === RenderKind.Prism) {
        game.Gl.uniformMatrix4fv(render.Material.Locations.World, false, transform.World);
        game.Gl.uniformMatrix4fv(render.Material.Locations.Self, false, transform.Self);
        game.Gl.uniform4fv(render.Material.Locations.DiffuseColor, render.DiffuseColor);
        game.Gl.uniform4fv(render.Material.Locations.EmissiveColor, render.EmissiveColor);
        game.Gl.bindVertexArray(render.Mesh.Vao);
        game.Gl.drawElements(render.Material.Mode, render.Mesh.IndexCount, GL_UNSIGNED_SHORT, 0);
        game.Gl.bindVertexArray(null);
    } else {
        let emitter = game.World.EmitParticles[entity];

        game.Gl.uniform4fv(render.Material.Locations.ColorStart, render.ColorStart);
        game.Gl.uniform4fv(render.Material.Locations.ColorEnd, render.ColorEnd);
        game.Gl.uniform4f(
            render.Material.Locations.Details,
            emitter.Lifespan,
            emitter.Speed,
            ...render.Size,
        );

        game.Gl.bindBuffer(GL_ARRAY_BUFFER, render.Buffer);
        game.Gl.bufferSubData(GL_ARRAY_BUFFER, 0, Float32Array.from(emitter.Instances));

        game.Gl.enableVertexAttribArray(render.Material.Locations.OriginAge);
        game.Gl.vertexAttribPointer(
            render.Material.Locations.OriginAge,
            4,
            GL_FLOAT,
            false,
            FLOATS_PER_PARTICLE * 4,
            0,
        );
        game.Gl.enableVertexAttribArray(render.Material.Locations.Direction);
        game.Gl.vertexAttribPointer(
            render.Material.Locations.Direction,
            3,
            GL_FLOAT,
            false,
            FLOATS_PER_PARTICLE * 4,
            4 * 4,
        );
        game.Gl.drawArrays(
            render.Material.Mode,
            0,
            emitter.Instances.length / FLOATS_PER_PARTICLE,
        );
    }
}
