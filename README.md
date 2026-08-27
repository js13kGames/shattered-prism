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

The original target was 13312 bytes. The first version of the game, an arena
survival mode, came in at 11701. The rebuild into a labyrinth with shadows,
three weapons, visible viewmodels and stateful AI is larger. The size is still
measured and reported on every commit, and the discipline that keeps it small —
no assets, one material, generated geometry — is unchanged.
