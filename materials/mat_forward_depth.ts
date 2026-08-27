import {link, Material} from "../lib/material.js";
import {GL_TRIANGLES} from "../lib/webgl.js";
import {Attribute, DepthLayout} from "./layout.js";

/**
 * Position only. The depth pass writes nothing but the depth buffer, which is
 * the shadow map.
 */
let vertex = `#version 300 es\n
    uniform mat4 pv;
    uniform mat4 world;

    layout(location=${Attribute.Position}) in vec4 attr_position;

    void main() {
        gl_Position = pv * world * attr_position;
    }
`;

let fragment = `#version 300 es\n
    precision mediump float;
    out vec4 frag_color;
    void main() {
        frag_color = vec4(1.0);
    }
`;

export function mat_forward_depth(gl: WebGL2RenderingContext): Material<DepthLayout> {
    let program = link(gl, vertex, fragment);
    return {
        Mode: GL_TRIANGLES,
        Program: program,
        Locations: {
            Pv: gl.getUniformLocation(program, "pv")!,
            World: gl.getUniformLocation(program, "world")!,
        },
    };
}
