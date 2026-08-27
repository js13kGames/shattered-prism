// The forward rendering pipeline supports 8 lights. Unicorns are lit by their
// own emissive color and the bloom pass, not by a light each, so the slots go
// to the arena: the sun, and whatever the game flashes at the player.
export const MAX_FORWARD_LIGHTS = 8;

export const enum LightKind {
    Inactive,
    Ambient,
    Directional,
    Point,
}
