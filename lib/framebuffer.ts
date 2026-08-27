import {
    resize_texture_depth24,
    resize_texture_depth32f,
    resize_texture_rgba32f,
    resize_texture_rgba8,
} from "./texture.js";
import {
    GL_COLOR_ATTACHMENT0,
    GL_DEPTH_ATTACHMENT,
    GL_FRAMEBUFFER,
    GL_FRAMEBUFFER_COMPLETE,
    GL_TEXTURE_2D,
} from "./webgl.js";

export type RenderTarget = ForwardTarget;

export const enum TargetKind {
    Forward,
    Hdr,
    Deferred,
    Depth,
}

export interface ForwardTarget {
    Kind: TargetKind.Forward;
    Framebuffer: WebGLFramebuffer;
    Width: number;
    Height: number;
    ResizeToViewport: boolean;
    ColorTexture: WebGLTexture;
    DepthTexture: WebGLTexture;
}

export function create_forward_target(
    gl: WebGL2RenderingContext,
    width: number,
    height: number,
    resize_to_viewport: boolean,
) {
    let target: ForwardTarget = {
        Kind: TargetKind.Forward,
        Framebuffer: gl.createFramebuffer()!,
        Width: width,
        Height: height,
        ResizeToViewport: resize_to_viewport,
        ColorTexture: resize_texture_rgba8(gl, gl.createTexture()!, width, height),
        DepthTexture: resize_texture_depth24(gl, gl.createTexture()!, width, height),
    };

    gl.bindFramebuffer(GL_FRAMEBUFFER, target.Framebuffer);
    gl.framebufferTexture2D(
        GL_FRAMEBUFFER,
        GL_COLOR_ATTACHMENT0,
        GL_TEXTURE_2D,
        target.ColorTexture,
        0,
    );
    gl.framebufferTexture2D(
        GL_FRAMEBUFFER,
        GL_DEPTH_ATTACHMENT,
        GL_TEXTURE_2D,
        target.DepthTexture,
        0,
    );

    let status = gl.checkFramebufferStatus(GL_FRAMEBUFFER);
    if (status != GL_FRAMEBUFFER_COMPLETE) {
        throw new Error(`Failed to set up the framebuffer (${status}).`);
    }

    return target;
}

export function resize_forward_target(
    gl: WebGL2RenderingContext,
    target: ForwardTarget,
    width: number,
    height: number,
) {
    target.Width = width;
    target.Height = height;

    resize_texture_rgba8(gl, target.ColorTexture, target.Width, target.Height);
    resize_texture_depth24(gl, target.DepthTexture, target.Width, target.Height);
}
