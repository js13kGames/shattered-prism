/**
 * # sys_render_depth
 *
 * Render the level into the sun's depth target. That depth buffer is the
 * shadow map the world material samples.
 *
 * Only opaque geometry is drawn, with a position-only material: particles do
 * not cast shadows, and neither does the weapon in the player's hands.
 */

import {
    GL_FRAMEBUFFER,
    GL_TEXTURE1,
    GL_TEXTURE_2D,
    GL_TRIANGLES,
    GL_UNSIGNED_SHORT,
} from "../../lib/webgl.js";
import {CLEAR_MASK} from "../components/com_camera.js";
import {RenderKind} from "../components/com_render.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.Transform | Has.Render;

export function sys_render_depth(game: Game, delta: number) {
    let camera = game.World.Camera[game.Sun];
    let material = game.MaterialDepth;

    // Unbind the shadow map first. The forward pass leaves it bound as a
    // sampler, and rendering into a texture that is still bound for reading is
    // a feedback loop: undefined by the spec, and ruinously slow in practice.
    game.Gl.activeTexture(GL_TEXTURE1);
    game.Gl.bindTexture(GL_TEXTURE_2D, null);

    game.Gl.bindFramebuffer(GL_FRAMEBUFFER, camera.Target.Framebuffer);
    game.Gl.viewport(0, 0, camera.Target.Width, camera.Target.Height);
    game.Gl.clear(CLEAR_MASK);

    game.Gl.useProgram(material.Program);
    game.Gl.uniformMatrix4fv(material.Locations.Pv, false, camera.Pv);

    for (let ent = 0; ent < game.World.Signature.length; ent++) {
        if ((game.World.Signature[ent] & QUERY) === QUERY) {
            let render = game.World.Render[ent];
            if (render.Kind !== RenderKind.Prism || render.NoShadow) {
                continue;
            }

            game.Gl.uniformMatrix4fv(
                material.Locations.World,
                false,
                game.World.Transform[ent].World,
            );
            game.Gl.bindVertexArray(render.Mesh.Vao);
            game.Gl.drawElements(GL_TRIANGLES, render.Mesh.IndexCount, GL_UNSIGNED_SHORT, 0);
        }
    }

    game.Gl.bindVertexArray(null);
}
