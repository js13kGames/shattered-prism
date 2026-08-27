# Shattered Prism

An arena-survival FPS in a brutalist megastructure. Waves of geometric unicorns
come at you. They bleed neon. Kill them up close and the neon heals you.

The game ships as one HTML file under 13 KB. It has no asset files at all.

## Controls

| Input | Action |
|---|---|
| WASD | Move |
| Mouse | Look |
| Left mouse button | Fire a rebar |
| Space | Jump. Press it again in the air to dash. |
| Left shift | Slide |

The rebar shoves you back when it fires. Aim down and shoot to launch yourself.

## Run it

    npm install
    npm start

Then open <http://localhost:1234/src/>.

## Build it

    make -C play              # play/index.html, one file with everything inlined
    make -C play index.zip    # play/index.zip
    RELEASE=1 make -C play index.zip   # slower, smaller

The zip target needs `7zz` and `advzip`. On macOS with MacPorts, install them
with `sudo port install 7zip advancecomp`. With Homebrew, use `brew install
sevenzip advancecomp`.

## Check it

    npx tsc --noEmit    # types
    npm run selftest    # the maths that fails silently

## How it is built

The game uses the [Goodluck](https://github.com/piesku/goodluck) template. The
template is not a library: the code in this repository is the game, and you can
change all of it. `goodluck/` holds the original template and four finished
games, as read-only reference.

The architecture is ECS. An entity is a number. A component is data only. A
system is a free function that loops over a bitmask of component signatures.
Systems run in a fixed order in `Game.FrameUpdate` in `src/game.ts`.

Nothing is loaded from a file:

- **Meshes.** One function, `mesh_prism`, builds every solid in the game. A
  four-sided prism is a cube. An eight-sided prism is a cylinder. Generating the
  vertices costs less code than storing them, and the code compresses better.
- **Sounds.** Web Audio synthesis from parameter arrays in `src/sounds.ts`.
- **Textures.** There are none. The concrete grain is a hash of the world
  position in the fragment shader.

The renderer draws the world into a 320x240 target and upscales it with nearest
filtering. One material draws everything: it snaps vertices to a coarse grid in
clip space, lights per vertex, and fogs per fragment. A single composite pass
adds the bloom, the film grain and the vignette on the way to the canvas.

Only emissive surfaces are bright enough to pass the bloom threshold, so the
neon bleeds and the concrete does not.

## Size

Every commit message ends with the size of `play/index.zip` in bytes.
