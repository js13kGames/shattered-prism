# Shattered Prism

A first-person shooter in the style of the middle 1990s. You are inside a
brutalist megastructure. Geometric unicorns patrol it, and they bleed neon. Find
the way out.

The game ships as one HTML file. It has no asset files at all: no models, no
textures, no audio. Everything is generated in code.

## Controls

| Input | Action |
|---|---|
| WASD | Move |
| Mouse | Look |
| Left mouse button | Fire |
| 1, 2, 3 or mouse wheel | Change weapon |
| Space | Jump. Press it again in the air to dash. |
| Left shift | Slide |

Firing shoves you back. Aim at the floor with the mortar and the recoil is a
rocket jump.

Enemies patrol fixed routes and ignore you until they see you. Break the line of
sight and they lose you.

## Run it

    npm install
    npm start

Then open <http://localhost:1234/src/>.

## Build it

    make -C play              # play/index.html, one file with everything inlined
    make -C play index.zip    # play/index.zip
    RELEASE=1 make -C play index.zip   # slower, smaller

The build also makes the shaders smaller. `play/glsl.cjs` removes the white
space from each shader and gives each shader variable a short name. The source
shaders stay easy to read.

The zip target needs `7zz` and `advzip`. On macOS with MacPorts, install them
with `sudo port install 7zip advancecomp`. With Homebrew, use `brew install
sevenzip advancecomp`.

## Check it

    npx tsc --noEmit    # types
    npm run selftest    # the level, and the maths that fails silently

The self-check is the important one. It flood-fills the level the way the player
can actually move — one step up, any drop, lifts, jump pads — and fails if the
exit cannot be reached. It also walks every patrol route cell by cell and fails
if a route runs into a wall, up a ledge that is too tall, or through a pillar.
None of that is visible in a screenshot, and all of it breaks with one wrong
number in `src/map.ts`.

## How it is built

The game uses the [Goodluck](https://github.com/piesku/goodluck) template. The
template is not a library: the code in this repository is the game, and you can
change all of it. `goodluck/` holds the original template and four finished
games, as read-only reference.

The architecture is ECS. An entity is a number. A component is data only. A
system is a free function that loops over a bitmask of component signatures.
Systems run in a fixed order in `Game.FrameUpdate` in `src/game.ts`.

### The level

`src/map.ts` is the level as data: rectangles of floor at given step levels, and
lists of lamps, crates, pillars, pickups, lifts, pads and enemy routes. It
imports nothing from the browser, which is what lets the self-check walk it.

`src/level.ts` turns that data into entities. Before it instantiates anything it
merges the grid cells into as few rectangles as it can, so a ten-by-ten room
floor is one box rather than a hundred: one draw call, one collider, one shadow
caster.

### Nothing is loaded from a file

* **Meshes.** One function, `mesh_prism`, builds every solid in the game. A
  four-sided prism is a cube. An eight-sided prism is a cylinder. Generating the
  vertices costs less code than storing them, and the code compresses better.
* **Sounds.** Web Audio synthesis from parameter arrays in `src/sounds.ts`.
* **Textures.** There are none. The concrete grain is a hash of the world
  position in the fragment shader.

### Rendering

Two passes fill the frame. The sun renders the level's depth into a shadow map.
Then the player's camera renders the world into a 320x240 target with one
material: per-pixel lighting, shadow lookup, vertex snapping, concrete grain and
fog. A final composite pass scales that target up to the window with
nearest-neighbour filtering and adds bloom, film grain and a vignette.

The forward pipeline takes eight lights, and the level has more lamps than that,
so the sun goes in first and the rest of the slots go to the lamps nearest the
camera.

## Size

Every commit message ends with the size of `play/index.zip` in bytes.

The target is 13,312 bytes. The labyrinth version started at 15,528 bytes. The
removal of unused code and the shader build step brought it to approximately
13,650 bytes, and to 13,606 bytes with `RELEASE=1`.

The packer is not deterministic. The same code can give a zip that is 30 bytes
larger or smaller. Compare sizes over more than one build.

Shorter code does not always give a smaller zip. The packer already compresses
repeated code very well. To make the zip smaller, remove code that is unique.
