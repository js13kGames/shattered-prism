import {Mesh} from "../lib/mesh.js";
import {GL_ARRAY_BUFFER, GL_ELEMENT_ARRAY_BUFFER, GL_FLOAT, GL_STATIC_DRAW} from "../lib/webgl.js";
import {Attribute} from "../materials/layout.js";

/**
 * Build a flat-shaded prism with `sides` sides, radius `radius`, height 1,
 * centered on the origin.
 *
 * Every mesh in the game comes from this one function. `mesh_prism(gl, 4,
 * Math.SQRT1_2)` is a unit cube; `mesh_prism(gl, 8, 0.5)` is a chunky cylinder.
 * Generating the vertices costs less code than storing them, and the code
 * compresses better than a table of floats.
 */
export function mesh_prism(gl: WebGL2RenderingContext, sides: number, radius: number): Mesh {
    let vertices: Array<number> = [];
    let normals: Array<number> = [];
    let indices: Array<number> = [];

    // Ring positions, offset by half a segment so that a 4-sided prism is
    // axis-aligned.
    let ring: Array<number> = [];
    for (let i = 0; i < sides; i++) {
        let a = ((i + 0.5) / sides) * 2 * Math.PI;
        ring.push(Math.cos(a) * radius, Math.sin(a) * radius);
    }

    // Sides: one quad per segment, with its own vertices for flat normals.
    for (let i = 0; i < sides; i++) {
        let j = (i + 1) % sides;
        let x1 = ring[i * 2];
        let z1 = ring[i * 2 + 1];
        let x2 = ring[j * 2];
        let z2 = ring[j * 2 + 1];

        // Outward normal of the quad, from the midpoint of the edge.
        let nx = (x1 + x2) / 2;
        let nz = (z1 + z2) / 2;
        let nl = Math.hypot(nx, nz);

        let base = vertices.length / 3;
        vertices.push(x1, -0.5, z1, x2, -0.5, z2, x2, 0.5, z2, x1, 0.5, z1);
        for (let k = 0; k < 4; k++) {
            normals.push(nx / nl, 0, nz / nl);
        }
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }

    // Caps: one triangle fan each, with their own vertices for flat normals.
    for (let cap = 0; cap < 2; cap++) {
        let y = cap ? 0.5 : -0.5;
        let base = vertices.length / 3;
        for (let i = 0; i < sides; i++) {
            vertices.push(ring[i * 2], y, ring[i * 2 + 1]);
            normals.push(0, cap ? 1 : -1, 0);
        }
        // Wind the fan so that it is clockwise seen from outside, like the
        // sides, so that one frontFace(GL_CW) covers the whole mesh.
        for (let i = 1; i < sides - 1; i++) {
            if (cap) {
                indices.push(base, base + i, base + i + 1);
            } else {
                indices.push(base, base + i + 1, base + i);
            }
        }
    }

    let vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    attribute(gl, Attribute.Position, vertices);
    attribute(gl, Attribute.Normal, normals);
    gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, gl.createBuffer()!);
    gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, Uint16Array.from(indices), GL_STATIC_DRAW);
    gl.bindVertexArray(null);

    return {Vao: vao, IndexCount: indices.length};
}

function attribute(gl: WebGL2RenderingContext, location: Attribute, data: Array<number>) {
    gl.bindBuffer(GL_ARRAY_BUFFER, gl.createBuffer()!);
    gl.bufferData(GL_ARRAY_BUFFER, Float32Array.from(data), GL_STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 3, GL_FLOAT, false, 0, 0);
}

/**
 * A fullscreen quad in clip space, for the postprocess pass. Positions only;
 * the shader derives UVs from them.
 */
export function mesh_quad(gl: WebGL2RenderingContext): Mesh {
    let vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    attribute(gl, Attribute.Position, [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]);
    gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, gl.createBuffer()!);
    gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, Uint16Array.from([0, 2, 1, 0, 3, 2]), GL_STATIC_DRAW);
    gl.bindVertexArray(null);

    return {Vao: vao, IndexCount: 6};
}
