import {
    GL_CLAMP_TO_EDGE,
    GL_COLOR_ATTACHMENT0,
    GL_COMPARE_REF_TO_TEXTURE,
    GL_DATA_UNSIGNED_BYTE,
    GL_DATA_UNSIGNED_INT,
    GL_DEPTH_ATTACHMENT,
    GL_DEPTH_COMPONENT,
    GL_DEPTH_COMPONENT24,
    GL_FRAMEBUFFER,
    GL_FRAMEBUFFER_COMPLETE,
    GL_LINEAR,
    GL_NEAREST,
    GL_RGBA,
    GL_RGBA8,
    GL_TEXTURE_2D,
    GL_TEXTURE_COMPARE_MODE,
    GL_TEXTURE_MAG_FILTER,
    GL_TEXTURE_MIN_FILTER,
    GL_TEXTURE_WRAP_S,
    GL_TEXTURE_WRAP_T,
} from "./webgl.js";

export interface RenderTarget {
    Framebuffer: WebGLFramebuffer;
    Width: number;
    Height: number;
    ColorTexture: WebGLTexture;
    DepthTexture: WebGLTexture;
}

/**
 * A fixed-size target with a colour and a depth attachment. The game uses one
 * for the 320x240 scene, and one for the sun's shadow map.
 *
 * The colour texture uses nearest-neighbour filtering: that is the whole
 * chunky-upscale effect. The depth texture is depth24 with comparison sampling
 * on, so the world shader can read it as a `sampler2DShadow` and get filtered
 * occlusion for free, without the float-texture extension.
 */
export function create_target(gl: WebGL2RenderingContext, width: number, height: number) {
    let target: RenderTarget = {
        Framebuffer: gl.createFramebuffer()!,
        Width: width,
        Height: height,
        ColorTexture: gl.createTexture()!,
        DepthTexture: gl.createTexture()!,
    };

    gl.bindTexture(GL_TEXTURE_2D, target.ColorTexture);
    gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, width, height, 0, GL_RGBA, GL_DATA_UNSIGNED_BYTE, null);
    gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);

    gl.bindTexture(GL_TEXTURE_2D, target.DepthTexture);
    gl.texImage2D(
        GL_TEXTURE_2D,
        0,
        GL_DEPTH_COMPONENT24,
        width,
        height,
        0,
        GL_DEPTH_COMPONENT,
        GL_DATA_UNSIGNED_INT,
        null,
    );
    gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_COMPARE_MODE, GL_COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

    gl.bindFramebuffer(GL_FRAMEBUFFER, target.Framebuffer);
    gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, target.ColorTexture, 0);
    gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, target.DepthTexture, 0);

    if (DEBUG && gl.checkFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) {
        throw new Error("Failed to set up the framebuffer.");
    }

    return target;
}
