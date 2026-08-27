# Game Design Document: Shattered Prism

## 1. Core Concept
**Shattered Prism** is an ultra-fast-paced, arena-survival FPS set in a bleak, brutalist megastructure. The player fights off waves of nightmarish, geometric unicorns that bleed toxic, neon rainbows. Designed for strict file-size limits, the game relies entirely on primitive 3D shapes, low-resolution textures, and aggressive post-processing to create a claustrophobic, lo-fi analog horror aesthetic.

---

## 2. Visual Identity & Post-Processing
The art direction deliberately exploits early 3D rendering limitations. This builds a gritty atmosphere while keeping asset sizes microscopic.

*   **Internal Resolution Constraint:** The game renders at a native 320x240 resolution (or similar low-res target) and is upscaled to the window size, forcing a chunky, pixelated look without needing complex textures.
*   **Vertex Snapping (Jitter):** Vertex coordinates are rounded to a grid during rendering. As the camera moves, models subtly shake and snap, mimicking iconic PS1 hardware limitations.
*   **Affine Texture Mapping:** Textures deliberately lack perspective correction. They warp and "swim" unnervingly when viewed at sharp angles.
*   **High-Contrast Palette:** The environment is strictly monochromatic concrete. The only colors are the blinding, hyper-saturated neon rainbows emitted by unicorns and their attacks.
*   **Bloom & Grain:** Heavy, bleeding bloom is applied exclusively to the neon colors. A dense, moving film grain covers the entire screen to hide the simple geometry and build tension.

---

## 3. World & Environment
*   **Brutalist Architecture:** The arena consists entirely of massive, imposing cubes, cylinders, and spheres.
*   **Micro-Textures:** Only one or two highly compressed, noisy 64x64 pixel concrete textures are tiled across all static surfaces.
*   **Destructible Terrain:** Environmental primitives shatter into smaller geometric primitives upon taking damage. The arena constantly degrades, removing cover and forcing the player to adapt to an evolving landscape.

---

## 4. Enemies & Combat Loop
*   **The Unicorns:** Abstract, jagged entities constructed purely from intersecting cylinders (legs/horns) and cubes (bodies). They glow with an aggressive, colorful light.
*   **Movement:** Extreme mobility inspired by *Quake* and *Devil Daggers*. The player can air-dash, slide, and use weapon knockback to traverse the degrading arena.
*   **Weaponry & Reward:** The player fires crude, heavy concrete rebars (scaled cylinders). Close-range kills cause enemies to explode in a shower of healing neon pixels, forcing an aggressive, push-forward combat style.

---

## 5. File Size Optimization Strategy
*   **Zero Imported Meshes:** Every object, enemy, and particle is assembled in-engine using base mathematical primitives.
*   **Procedural Audio:** Sound effects are generated via code (e.g., white noise bursts for explosions, simple saw waves for shooting) rather than using audio files.
