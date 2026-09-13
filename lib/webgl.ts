// The following defined constants and descriptions are directly ported from
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants.

// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/.

// Contributors
// https://developer.mozilla.org/en-US/profiles/Sheppy
// https://developer.mozilla.org/en-US/profiles/fscholz
// https://developer.mozilla.org/en-US/profiles/AtiX
// https://developer.mozilla.org/en-US/profiles/Sebastianz

// WebGLRenderingContext
// ==============

// Clearing buffers
// Constants passed to WebGLRenderingContext.clear() to clear buffer masks.

/**
 * Passed to clear to clear the current depth buffer.
 * @constant {number}
 */
export const GL_DEPTH_BUFFER_BIT: number = 0x00000100;

/**
 * Passed to clear to clear the current color buffer.
 * @constant {number}
 */
export const GL_COLOR_BUFFER_BIT: number = 0x00004000;

// Rendering primitives
// Constants passed to WebGLRenderingContext.drawElements() or WebGLRenderingContext.drawArrays() to specify what kind of primitive to render.

/**
 * Passed to drawElements or drawArrays to draw single points.
 * @constant {number}
 */
export const GL_POINTS: number = 0x0000;

/**
 * Passed to drawElements or drawArrays to draw triangles. Each set of three vertices creates a separate triangle.
 * @constant {number}
 */
export const GL_TRIANGLES: number = 0x0004;

/**
 * Passed to drawElements or drawArrays to draw a connected group of triangles. Each vertex connects to the previous and the first vertex in the fan.
 * @constant {number}
 */
export const GL_TRIANGLE_FAN: number = 0x0006;

// Blending modes
// Constants passed to WebGLRenderingContext.blendFunc() or WebGLRenderingContext.blendFuncSeparate() to specify the blending mode (for both, RBG and alpha, or separately).

/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by the source's alpha.
 * @constant {number}
 */
export const GL_SRC_ALPHA: number = 0x0302;

/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source's alpha.
 * @constant {number}
 */
export const GL_ONE_MINUS_SRC_ALPHA: number = 0x0303;

// Blending equations
// Constants passed to WebGLRenderingContext.blendEquation() or WebGLRenderingContext.blendEquationSeparate() to control how the blending is calculated (for both, RBG and alpha, or separately).

// Getting GL parameter information
// Constants passed to WebGLRenderingContext.getParameter() to specify what information to return.

// Buffers
// Constants passed to WebGLRenderingContext.bufferData(), WebGLRenderingContext.bufferSubData(), WebGLRenderingContext.bindBuffer(), or WebGLRenderingContext.getBufferParameter().

/**
 * Passed to bufferData as a hint about whether the contents of the buffer are likely to be used often and not change often.
 * @constant {number}
 */
export const GL_STATIC_DRAW: number = 0x88e4;

/**
 * Passed to bufferData as a hint about whether the contents of the buffer are likely to be used often and change often.
 * @constant {number}
 */
export const GL_DYNAMIC_DRAW: number = 0x88e8;

/**
 * Passed to bindBuffer or bufferData to specify the type of buffer being used.
 * @constant {number}
 */
export const GL_ARRAY_BUFFER: number = 0x8892;

/**
 * Passed to bindBuffer or bufferData to specify the type of buffer being used.
 * @constant {number}
 */
export const GL_ELEMENT_ARRAY_BUFFER: number = 0x8893;

// Vertex attributes
// Constants passed to WebGLRenderingContext.getVertexAttrib().

// Culling
// Constants passed to WebGLRenderingContext.cullFace().

/**
 * Passed to enable/disable to turn on/off culling. Can also be used with getParameter to find the current culling method.
 * @constant {number}
 */
export const GL_CULL_FACE: number = 0x0b44;

// Enabling and disabling
// Constants passed to WebGLRenderingContext.enable() or WebGLRenderingContext.disable().

/**
 * Passed to enable/disable to turn on/off blending. Can also be used with getParameter to find the current blending method.
 * @constant {number}
 */
export const GL_BLEND: number = 0x0be2;

/**
 * Passed to enable/disable to turn on/off the depth test. Can also be used with getParameter to query the depth test.
 * @constant {number}
 */
export const GL_DEPTH_TEST: number = 0x0b71;

// Errors
// Constants returned from WebGLRenderingContext.getError().

// Front face directions
// Constants passed to WebGLRenderingContext.frontFace().

/**
 * Passed to frontFace to specify the front face of a polygon is drawn in the clockwise direction,
 * @constant {number}
 */
export const GL_CW: number = 0x0900;

// Hints
// Constants passed to WebGLRenderingContext.hint().

// Data types

/**
 * @constant {number}
 */
export const GL_DATA_UNSIGNED_BYTE: number = 0x1401;

/**
 * @constant {number}
 */
export const GL_DATA_UNSIGNED_INT: number = 0x1405;

// Pixel formats

/**
 * @constant {number}
 */
export const GL_DEPTH_COMPONENT: number = 0x1902;

/**
 * @constant {number}
 */
export const GL_RGBA: number = 0x1908;

// Pixel types

// Shaders
// Constants passed to WebGLRenderingContext.getShaderParameter().

/**
 * Passed to createShader to define a fragment shader.
 * @constant {number}
 */
export const GL_FRAGMENT_SHADER: number = 0x8b30;

/**
 * Passed to createShader to define a vertex shader.
 * @constant {number}
 */
export const GL_VERTEX_SHADER: number = 0x8b31;

/**
 * Passed to getShaderParamter to get the status of the compilation. Returns false if the shader was not compiled. You can then query getShaderInfoLog to find the exact error.
 * @constant {number}
 */
export const GL_COMPILE_STATUS: number = 0x8b81;

/**
 * Passed to getProgramParameter after calling linkProgram to determine if a program was linked correctly. Returns false if there were errors. Use getProgramInfoLog to find the exact error.
 * @constant {number}
 */
export const GL_LINK_STATUS: number = 0x8b82;

// Depth or stencil tests
// Constants passed to WebGLRenderingContext.stencilFunc().

// Stencil actions
// Constants passed to WebGLRenderingContext.stencilOp().

// Textures
// Constants passed to WebGLRenderingContext.texParameteri(), WebGLRenderingContext.texParameterf(), WebGLRenderingContext.bindTexture(), WebGLRenderingContext.texImage2D(), and others.

/**
 * @constant {number}
 */
export const GL_NEAREST: number = 0x2600;

/**
 * @constant {number}
 */
export const GL_LINEAR: number = 0x2601;

/**
 * @constant {number}
 */
export const GL_TEXTURE_MAG_FILTER: number = 0x2800;

/**
 * @constant {number}
 */
export const GL_TEXTURE_MIN_FILTER: number = 0x2801;

/**
 * @constant {number}
 */
export const GL_TEXTURE_WRAP_S: number = 0x2802;

/**
 * @constant {number}
 */
export const GL_TEXTURE_WRAP_T: number = 0x2803;

/**
 * @constant {number}
 */
export const GL_TEXTURE_2D: number = 0x0de1;

/**
 * A texture unit.
 * @constant {number}
 */
export const GL_TEXTURE0: number = 0x84c0;

/**
 * A texture unit.
 * @constant {number}
 */
export const GL_TEXTURE1: number = 0x84c1;

/**
 * @constant {number}
 */
export const GL_CLAMP_TO_EDGE: number = 0x812f;

// Uniform types

// Shader precision-specified types

// Framebuffers and renderbuffers

/**
 * @constant {number}
 */
export const GL_FRAMEBUFFER: number = 0x8d40;

/**
 * @constant {number}
 */
export const GL_COLOR_ATTACHMENT0: number = 0x8ce0;

/**
 * @constant {number}
 */
export const GL_DEPTH_ATTACHMENT: number = 0x8d00;

/**
 * @constant {number}
 */
export const GL_FRAMEBUFFER_COMPLETE: number = 0x8cd5;

// Pixel storage modes
// Constants passed to WebGLRenderingContext.pixelStorei().

// Additional constants defined WebGL 2
// These constants are defined on the WebGL2RenderingContext interface. All WebGL 1 constants are also available in a WebGL 2 context.

// Getting GL parameter information
// Constants passed to WebGLRenderingContext.getParameter() to specify what information to return.

// Textures
// Constants passed to WebGLRenderingContext.texParameteri(), WebGLRenderingContext.texParameterf(), WebGLRenderingContext.bindTexture(), WebGLRenderingContext.texImage2D(), and others.

/**
 * @constant {number}
 */
export const GL_RGBA8: number = 0x8058;

/**
 * @constant {number}
 */
export const GL_TEXTURE_COMPARE_MODE: number = 0x884c;

/**
 * @constant {number}
 */
export const GL_COMPARE_REF_TO_TEXTURE: number = 0x884e;

// Pixel types

// Queries

// Draw buffers

// Samplers

// Buffers

// Data types

// Vertex attributes

// Transform feedback

// Framebuffers and renderbuffers

// Uniforms

// Sync objects

// Miscellaneous constants

/**
 * @constant {number}
 */
export const GL_DEPTH_COMPONENT24: number = 0x81a6;

// Constants defined in WebGL extensions

// ANGLE_instanced_arrays
// The ANGLE_instanced_arrays extension is part of the WebGL API and allows to draw the same object, or groups of similar objects multiple times, if they share the same vertex data, primitive count and type.
// WEBGL_debug_renderer_info
// The WEBGL_debug_renderer_info extension is part of the WebGL API and exposes two constants with information about the graphics driver for debugging purposes.
// EXT_texture_filter_anisotropic
// The EXT_texture_filter_anisotropic extension is part of the WebGL API and exposes two constants for anisotropic filtering (AF).
// WEBGL_compressed_texture_s3tc
// The WEBGL_compressed_texture_s3tc extension is part of the WebGL API and exposes four S3TC compressed texture formats.
// WEBGL_compressed_texture_s3tc_srgb
// The WEBGL_compressed_texture_s3tc_srgb extension is part of the WebGL API and exposes four S3TC compressed texture formats for the sRGB colorspace.
// WEBGL_compressed_texture_etc
// The WEBGL_compressed_texture_etc extension is part of the WebGL API and exposes 10 ETC/EAC compressed texture formats.
// WEBGL_compressed_texture_pvrtc
// The WEBGL_compressed_texture_pvrtc extension is part of the WebGL API and exposes four PVRTC compressed texture formats.
// WEBGL_compressed_texture_etc1
// The WEBGL_compressed_texture_etc1 extension is part of the WebGL API and exposes the ETC1 compressed texture format.
// WEBGL_compressed_texture_atc
// The WEBGL_compressed_texture_atc extension is part of the WebGL API and exposes 3 ATC compressed texture formats. ATC is a proprietary compression algorithm for compressing textures on handheld devices.
// WEBGL_compressed_texture_astc
// The WEBGL_compressed_texture_astc extension is part of the WebGL API and exposes Adaptive Scalable Texture Compression (ASTC) compressed texture formats to WebGL.
// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
// https://developer.nvidia.com/astc-texture-compression-for-game-assets
// WEBGL_depth_texture
// The WEBGL_depth_texture extension is part of the WebGL API and defines 2D depth and depth-stencil textures.
// OES_texture_half_float
// The OES_texture_half_float extension is part of the WebGL API and adds texture formats with 16- (aka half float) and 32-bit floating-point components.
// WEBGL_color_buffer_float
// The WEBGL_color_buffer_float extension is part of the WebGL API and adds the ability to render to 32-bit floating-point color buffers.
// EXT_blend_minmax
// The EXT_blend_minmax extension is part of the WebGL API and extends blending capabilities by adding two new blend equations: the minimum or maximum color components of the source and destination colors.
// EXT_sRGB
// The EXT_sRGB extension is part of the WebGL API and adds sRGB support to textures and framebuffer objects.
// OES_standard_derivatives
// The OES_standard_derivatives extension is part of the WebGL API and adds the GLSL derivative functions dFdx, dFdy, and fwidth.
// WEBGL_draw_buffers
// The WEBGL_draw_buffers extension is part of the WebGL API and enables a fragment shader to write to several textures, which is useful for deferred shading, for example.
// OES_vertex_array_object
// The OES_vertex_array_object extension is part of the WebGL API and provides vertex array objects (VAOs) which encapsulate vertex array states. These objects keep pointers to vertex data and provide names for different sets of vertex data.
// EXT_disjoint_timer_query
// The EXT_disjoint_timer_query extension is part of the WebGL API and provides a way to measure the duration of a set of GL commands, without stalling the rendering pipeline.
// WebGL2RenderingContext
// ==============

export const GL_UNSIGNED_SHORT: number = 0x1403;

export const GL_FLOAT: number = 0x1406;
