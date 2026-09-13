/**
 * # sys_render_postprocess
 *
 * Blit the 320x240 scene target to the canvas through the composite shader:
 * nearest upscale, bloom, film grain, vignette.
 */

import {
    GL_FRAMEBUFFER,
    GL_TEXTURE0,
    GL_TEXTURE_2D,
    GL_TRIANGLES,
    GL_UNSIGNED_SHORT,
} from "../../lib/webgl.js";
import {Game} from "../game.js";

export function sys_render_postprocess(game: Game, delta: number) {
    let material = game.MaterialComposite;

    game.Gl.bindFramebuffer(GL_FRAMEBUFFER, null);
    game.Gl.viewport(0, 0, game.ViewportWidth, game.ViewportHeight);
    game.Gl.useProgram(material.Program);

    game.Gl.activeTexture(GL_TEXTURE0);
    game.Gl.bindTexture(GL_TEXTURE_2D, game.Targets.Scene.ColorTexture);
    game.Gl.uniform1i(material.Locations.Sampler, 0);
    // Seconds since load, wrapped, so that the grain crawls without the float
    // losing precision over a long session.
    game.Gl.uniform1f(material.Locations.Time, (game.Now / 1000) % 100);

    game.Gl.bindVertexArray(game.MeshQuad.Vao);
    // The canvas depth buffer is clear at the start of every frame, so the
    // quad passes the depth test without turning the test off.
    game.Gl.drawElements(GL_TRIANGLES, game.MeshQuad.IndexCount, GL_UNSIGNED_SHORT, 0);
}
