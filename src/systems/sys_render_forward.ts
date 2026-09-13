/**
 * # sys_render_forward
 *
 * Render the world into the player's 320x240 target.
 *
 * Three passes over the same entity list: opaque, then transparent particles,
 * then the viewmodel over a cleared depth buffer.
 */

import {Material} from "../../lib/material.js";
import {
    GL_ARRAY_BUFFER,
    GL_BLEND,
    GL_DEPTH_BUFFER_BIT,
    GL_FLOAT,
    GL_FRAMEBUFFER,
    GL_POINTS,
    GL_TEXTURE1,
    GL_TEXTURE_2D,
    GL_TRIANGLES,
    GL_UNSIGNED_SHORT,
} from "../../lib/webgl.js";
import {Entity} from "../../lib/world.js";
import {CLEAR_MASK, CameraEye} from "../components/com_camera.js";
import {FLOATS_PER_PARTICLE, Render, RenderKind, RenderPhase} from "../components/com_render.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.Transform | Has.Render;

export function sys_render_forward(game: Game, delta: number) {
    let camera = game.World.Camera[game.PlayerCamera];
    game.Gl.bindFramebuffer(GL_FRAMEBUFFER, camera.Target.Framebuffer);
    game.Gl.viewport(0, 0, camera.Target.Width, camera.Target.Height);
    game.Gl.clearColor(...camera.ClearColor);
    game.Gl.clear(CLEAR_MASK);

    let current: Material<unknown> | null = null;
    let deferred: Array<Entity> = [];
    let viewmodel: Array<Entity> = [];

    for (let ent = 0; ent < game.World.Signature.length; ent++) {
        if ((game.World.Signature[ent] & QUERY) === QUERY) {
            let phase = game.World.Render[ent].Phase;
            if (phase === RenderPhase.Transparent) {
                deferred.push(ent);
            } else if (phase === RenderPhase.Viewmodel) {
                viewmodel.push(ent);
            } else {
                current = draw(game, ent, camera, current);
            }
        }
    }

    // Particles are unsorted: every burst is a cloud of one neon, so overlap
    // order does not read.
    game.Gl.enable(GL_BLEND);
    for (let i = 0; i < deferred.length; i++) {
        current = draw(game, deferred[i], camera, current);
    }
    game.Gl.disable(GL_BLEND);

    if (viewmodel.length) {
        game.Gl.clear(GL_DEPTH_BUFFER_BIT);
        for (let i = 0; i < viewmodel.length; i++) {
            current = draw(game, viewmodel[i], camera, current);
        }
    }

    game.Gl.bindVertexArray(null);
}

function draw(game: Game, entity: Entity, eye: CameraEye, current: Material<unknown> | null) {
    let render = game.World.Render[entity];
    if (render.Material !== current) {
        use_material(game, render, eye);
    }
    draw_entity(game, entity);
    return render.Material;
}

function use_material(game: Game, render: Render, eye: CameraEye) {
    game.Gl.useProgram(render.Material.Program);
    game.Gl.uniformMatrix4fv(render.Material.Locations.Pv, false, eye.Pv);

    if (render.Kind === RenderKind.Prism) {
        let sun = game.World.Camera[game.Sun];
        game.Gl.uniform3fv(render.Material.Locations.Eye, eye.Position);
        game.Gl.uniform4fv(render.Material.Locations.LightPositions, game.LightPositions);
        game.Gl.uniform4fv(render.Material.Locations.LightDetails, game.LightDetails);
        game.Gl.uniform4fv(render.Material.Locations.FogColor, eye.FogColor);
        game.Gl.uniform1f(render.Material.Locations.FogDistance, eye.FogDistance);
        game.Gl.uniformMatrix4fv(render.Material.Locations.ShadowSpace, false, sun.Pv);

        // Unit 1: the postprocess pass owns unit 0.
        game.Gl.activeTexture(GL_TEXTURE1);
        game.Gl.bindTexture(GL_TEXTURE_2D, sun.Target.DepthTexture);
        game.Gl.uniform1i(render.Material.Locations.ShadowMap, 1);
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
        game.Gl.drawElements(GL_TRIANGLES, render.Mesh.IndexCount, GL_UNSIGNED_SHORT, 0);
        return;
    }

    let emitter = game.World.EmitParticles[entity];

    game.Gl.uniform4fv(render.Material.Locations.ColorStart, render.ColorStart);
    game.Gl.uniform4fv(render.Material.Locations.ColorEnd, render.ColorEnd);
    game.Gl.uniform4f(
        render.Material.Locations.Details,
        emitter.Lifespan,
        emitter.Speed,
        ...render.Size,
    );

    game.Gl.bindVertexArray(null);
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
    game.Gl.drawArrays(GL_POINTS, 0, emitter.Instances.length / FLOATS_PER_PARTICLE);
}
