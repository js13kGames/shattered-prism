import {link, Material} from "../lib/material.js";
import {ParticlesColoredLayout} from "./layout.js";

let vertex = `#version 300 es\n
    uniform mat4 pv;
    uniform vec4 color_start;
    uniform vec4 color_end;
    // [x: lifespan, y: speed, z: size_start, w: size_end];
    uniform vec4 details;

    // [x, y, z, w: age]
    in vec4 attr_origin_age;
    in vec3 attr_direction;

    out vec4 vert_color;

    void main() {
        // Move the particle along the direction axis.
        vec3 velocity = attr_direction * details.y;
        gl_Position = pv * vec4(attr_origin_age.xyz + velocity * attr_origin_age.w, 1.0);

        // Interpolate color and size.
        float t = attr_origin_age.w / details.x;
        gl_PointSize = mix(details.z, details.w, t);
        vert_color = mix(color_start, color_end, t);
    }
`;

let fragment = `#version 300 es\n
    precision mediump float;

    in vec4 vert_color;

    out vec4 frag_color;

    void main() {
        frag_color = vert_color;
    }
`;

export function mat_forward_particles_colored(
    gl: WebGL2RenderingContext,
): Material<ParticlesColoredLayout> {
    let program = link(gl, vertex, fragment);
    let uniform = (name: string) => gl.getUniformLocation(program, name)!;
    return {
        Program: program,
        Locations: {
            Pv: uniform("pv"),

            ColorStart: uniform("color_start"),
            ColorEnd: uniform("color_end"),
            Details: uniform("details"),

            OriginAge: gl.getAttribLocation(program, "attr_origin_age")!,
            Direction: gl.getAttribLocation(program, "attr_direction")!,
        },
    };
}
