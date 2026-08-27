import {link, Material} from "../lib/material.js";
import {GL_TRIANGLES} from "../lib/webgl.js";
import {Attribute, PrismLayout} from "./layout.js";
import {LightKind, MAX_FORWARD_LIGHTS} from "./light.js";

/**
 * The only material the world is drawn with: gouraud lighting, PS1 vertex
 * snapping, concrete grain and distance fog. One material means one shader
 * string in the bundle, which is the single largest size lever in the renderer.
 */
let vertex = `#version 300 es\n
    uniform mat4 pv;
    uniform mat4 world;
    uniform mat4 self;
    uniform vec3 eye;
    uniform vec4 diffuse_color;
    uniform vec4 emissive_color;
    uniform vec4 light_positions[${MAX_FORWARD_LIGHTS}];
    uniform vec4 light_details[${MAX_FORWARD_LIGHTS}];

    layout(location=${Attribute.Position}) in vec4 attr_position;
    layout(location=${Attribute.Normal}) in vec3 attr_normal;

    out vec4 vert_color;
    out vec3 vert_position;

    void main() {
        vec4 position = world * attr_position;
        vec3 normal = normalize((vec4(attr_normal, 0.0) * self).xyz);
        gl_Position = pv * position;

        // Vertex snapping: round the position to a coarse grid in normalized
        // device coordinates, the way hardware without subpixel precision did.
        vec2 grid = vec2(160.0, 120.0);
        gl_Position.xy = floor(gl_Position.xy / gl_Position.w * grid) / grid * gl_Position.w;

        // Ambient.
        vec3 acc = diffuse_color.rgb * 0.32;

        for (int i = 0; i < ${MAX_FORWARD_LIGHTS}; i++) {
            int kind = int(light_positions[i].w);
            if (kind == ${LightKind.Inactive}) {
                break;
            }

            vec3 light_rgb = light_details[i].rgb;
            float intensity = light_details[i].a;
            vec3 light_normal;

            if (kind == ${LightKind.Directional}) {
                light_normal = light_positions[i].xyz;
            } else {
                vec3 dir = light_positions[i].xyz - position.xyz;
                float dist = length(dir);
                light_normal = dir / dist;
                intensity /= dist * dist;
            }

            float factor = dot(normal, light_normal);
            if (factor > 0.0) {
                acc += diffuse_color.rgb * factor * light_rgb * intensity;
            }
        }

        vert_color = vec4(acc + emissive_color.rgb * emissive_color.a, diffuse_color.a);
        vert_position = position.xyz;
    }
`;

let fragment = `#version 300 es\n
    precision mediump float;

    uniform vec3 eye;
    uniform vec4 fog_color;
    uniform float fog_distance;

    in vec4 vert_color;
    in vec3 vert_position;

    out vec4 frag_color;

    void main() {
        // Concrete grain: a cheap value hash of the world position stands in
        // for a tiled noise texture, and costs no bytes and no upload.
        vec3 p = floor(vert_position * 6.0);
        float grain = fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);

        vec3 rgb = vert_color.rgb * (0.86 + grain * 0.28);

        // Fog has to be measured here, not in the vertex shader: the floor is
        // two triangles whose corners are all 50 units away, so interpolating a
        // per-vertex fog factor would bury the ground under the player in it.
        float fog = clamp(length(eye - vert_position) / fog_distance, 0.0, 1.0);
        frag_color = vec4(mix(rgb, fog_color.rgb, fog * fog), vert_color.a);
    }
`;

export function mat_forward_prism(gl: WebGL2RenderingContext): Material<PrismLayout> {
    let program = link(gl, vertex, fragment);
    return {
        Mode: GL_TRIANGLES,
        Program: program,
        Locations: {
            Pv: gl.getUniformLocation(program, "pv")!,
            World: gl.getUniformLocation(program, "world")!,
            Self: gl.getUniformLocation(program, "self")!,
            DiffuseColor: gl.getUniformLocation(program, "diffuse_color")!,
            EmissiveColor: gl.getUniformLocation(program, "emissive_color")!,
            Eye: gl.getUniformLocation(program, "eye")!,
            LightPositions: gl.getUniformLocation(program, "light_positions")!,
            LightDetails: gl.getUniformLocation(program, "light_details")!,
            FogColor: gl.getUniformLocation(program, "fog_color")!,
            FogDistance: gl.getUniformLocation(program, "fog_distance")!,
        },
    };
}
