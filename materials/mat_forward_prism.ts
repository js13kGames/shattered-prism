import {link, Material} from "../lib/material.js";
import {Attribute, PrismLayout} from "./layout.js";
import {LightKind, MAX_FORWARD_LIGHTS} from "./light.js";

/**
 * The only material the world is drawn with: per-pixel lighting, shadow
 * mapping from the sun, PS1 vertex snapping, concrete grain and distance fog.
 *
 * Lighting is per fragment rather than per vertex because the level is built
 * from a few hundred big boxes; a wall is four vertices, and a lamp halfway
 * along it has to light its middle.
 */
let vertex = `#version 300 es\n
    uniform mat4 pv;
    uniform mat4 world;
    uniform mat4 self;
    uniform mat4 shadow_space;

    layout(location=${Attribute.Position}) in vec4 attr_position;
    layout(location=${Attribute.Normal}) in vec3 attr_normal;

    out vec3 vert_position;
    out vec3 vert_normal;
    out vec4 vert_shadow;

    void main() {
        vec4 position = world * attr_position;
        gl_Position = pv * position;

        // Vertex snapping: round the position to a coarse grid in normalized
        // device coordinates, the way hardware without subpixel precision did.
        // Only in front of the camera; behind it the divide flips the sign and
        // tears the triangle apart.
        if (gl_Position.w > 0.0) {
            vec2 grid = vec2(160.0, 120.0);
            gl_Position.xy = floor(gl_Position.xy / gl_Position.w * grid) / grid * gl_Position.w;
        }

        vert_position = position.xyz;
        vert_normal = (vec4(attr_normal, 0.0) * self).xyz;
        vert_shadow = shadow_space * position;
    }
`;

let fragment = `#version 300 es\n
    precision mediump float;
    precision mediump sampler2DShadow;

    uniform vec3 eye;
    uniform vec4 diffuse_color;
    uniform vec4 emissive_color;
    uniform vec4 light_positions[${MAX_FORWARD_LIGHTS}];
    uniform vec4 light_details[${MAX_FORWARD_LIGHTS}];
    uniform vec4 fog_color;
    uniform float fog_distance;
    uniform sampler2DShadow shadow_map;

    in vec3 vert_position;
    in vec3 vert_normal;
    in vec4 vert_shadow;

    out vec4 frag_color;

    void main() {
        vec3 normal = normalize(vert_normal);

        // Concrete grain: a cheap value hash of the world position stands in
        // for a tiled noise texture, and costs no bytes and no upload.
        vec3 cell = floor(vert_position * 6.0);
        float grain = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        vec3 albedo = diffuse_color.rgb * (0.86 + grain * 0.28);

        vec3 acc = albedo * 0.26;

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

                // Shadow mapping. The sun is the only shadow caster; the point
                // lights are lamps, and they cost nothing.
                vec3 ndc = vert_shadow.xyz / vert_shadow.w;
                ndc.z -= 0.004;
                ndc = ndc * 0.5 + 0.5;
                if (ndc.x > 0.0 && ndc.x < 1.0 && ndc.y > 0.0 && ndc.y < 1.0) {
                    intensity *= texture(shadow_map, ndc);
                }
            } else {
                vec3 dir = light_positions[i].xyz - vert_position;
                float dist = length(dir);
                light_normal = dir / dist;
                // Softened inverse-square. Pure 1/d^2 puts a scorched white
                // pool under every lamp and nothing three steps away; the
                // constant term caps the near field and lets the light carry.
                intensity /= 1.0 + dist * dist * 0.05;
            }

            float factor = dot(normal, light_normal);
            if (factor > 0.0) {
                acc += albedo * factor * light_rgb * intensity;
            }
        }

        acc += emissive_color.rgb * emissive_color.a;

        // Fog is measured here, not in the vertex shader: a room floor is two
        // triangles whose corners are all far away, so interpolating a
        // per-vertex fog factor would bury the ground under the player in it.
        float fog = clamp(length(eye - vert_position) / fog_distance, 0.0, 1.0);
        frag_color = vec4(mix(acc, fog_color.rgb, fog * fog), diffuse_color.a);
    }
`;

export function mat_forward_prism(gl: WebGL2RenderingContext): Material<PrismLayout> {
    let program = link(gl, vertex, fragment);
    let uniform = (name: string) => gl.getUniformLocation(program, name)!;
    return {
        Program: program,
        Locations: {
            Pv: uniform("pv"),
            World: uniform("world"),
            Self: uniform("self"),
            DiffuseColor: uniform("diffuse_color"),
            EmissiveColor: uniform("emissive_color"),
            Eye: uniform("eye"),
            LightPositions: uniform("light_positions"),
            LightDetails: uniform("light_details"),
            FogColor: uniform("fog_color"),
            FogDistance: uniform("fog_distance"),
            ShadowSpace: uniform("shadow_space"),
            ShadowMap: uniform("shadow_map"),
        },
    };
}
