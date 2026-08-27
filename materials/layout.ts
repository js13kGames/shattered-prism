/**
 * Attribute locations shared by all materials.
 */
export const enum Attribute {
    Position,
    Normal,
}

export interface PrismLayout {
    Pv: WebGLUniformLocation;
    World: WebGLUniformLocation;
    Self: WebGLUniformLocation;
    DiffuseColor: WebGLUniformLocation;
    EmissiveColor: WebGLUniformLocation;
    Eye: WebGLUniformLocation;
    LightPositions: WebGLUniformLocation;
    LightDetails: WebGLUniformLocation;
    FogColor: WebGLUniformLocation;
    FogDistance: WebGLUniformLocation;
}

export interface PostprocessLayout {
    Sampler: WebGLUniformLocation;
    Time: WebGLUniformLocation;
}

export interface ParticlesColoredLayout {
    Pv: WebGLUniformLocation;
    ColorStart: WebGLUniformLocation;
    ColorEnd: WebGLUniformLocation;
    Details: WebGLUniformLocation;

    // Attributes
    OriginAge: GLint;
    Direction: GLint;
}
