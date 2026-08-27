import {link, Material} from "../lib/material.js";
import {GL_TRIANGLES} from "../lib/webgl.js";
import {Attribute, PostprocessLayout} from "./layout.js";

/**
 * The whole postprocess chain in one pass: nearest upscale from the 320x240
 * target, bloom that only the neon is bright enough to trigger, moving film
 * grain, and a vignette.
 *
 * The reference pipeline does bloom with a brightness pass and a ping-pong blur
 * across three extra float targets. We render to an 8-bit target instead, where
 * nothing can exceed 1.0, so the threshold sits below 1.0 and the blur is a ring
 * of taps taken here. One program, one pass, no float extension.
 */
let vertex = `#version 300 es\n
    layout(location=${Attribute.Position}) in vec4 attr_position;

    out vec2 vert_uv;

    void main() {
        gl_Position = attr_position;
        vert_uv = attr_position.xy * 0.5 + 0.5;
    }
`;

let fragment = `#version 300 es\n
    precision mediump float;

    uniform sampler2D sampler;
    uniform float time;

    in vec2 vert_uv;

    out vec4 frag_color;

    const vec2 TEXEL = vec2(1.0 / 320.0, 1.0 / 240.0);
    const float THRESHOLD = 0.5;

    void main() {
        vec3 color = texture(sampler, vert_uv).rgb;

        // Bloom. Two concentric rings of taps, keeping only what is over the
        // threshold; the gray concrete never is, the neon always is.
        vec3 bloom = vec3(0.0);
        for (int i = 0; i < 10; i++) {
            float a = float(i) * 0.6283;
            vec2 dir = vec2(cos(a), sin(a)) * TEXEL;
            bloom += max(texture(sampler, vert_uv + dir * 3.0).rgb - THRESHOLD, 0.0);
            bloom += max(texture(sampler, vert_uv + dir * 8.0).rgb - THRESHOLD, 0.0);
        }
        color += bloom * 0.16;

        // Film grain, reseeded every frame.
        float grain = fract(sin(dot(vert_uv + time, vec2(12.9898, 78.233))) * 43758.5453);
        color += grain * 0.13 - 0.065;

        // Vignette.
        vec2 d = vert_uv - 0.5;
        frag_color = vec4(color * (1.0 - dot(d, d) * 0.9), 1.0);
    }
`;

export function mat_postprocess_prism(gl: WebGL2RenderingContext): Material<PostprocessLayout> {
    let program = link(gl, vertex, fragment);
    return {
        Mode: GL_TRIANGLES,
        Program: program,
        Locations: {
            Sampler: gl.getUniformLocation(program, "sampler")!,
            Time: gl.getUniformLocation(program, "time")!,
        },
    };
}
