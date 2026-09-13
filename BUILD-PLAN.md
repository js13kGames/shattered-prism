# Shattered Prism — Build Plan

> **Status.** This plan describes the first build: an arena survival game on the
> Goodluck template. That version was finished and is in the history at
> `Land debris on the floor, extract the maths, add a self-check (11701b)`.
>
> The game has since been rebuilt as a 1990s-style labyrinth shooter with
> shadows, lifts, jump pads, patrol AI and three weapons. See
> [game-design-doc.md](game-design-doc.md) for what the game is now, and the
> README for how it is put together. Sections 1 to 4 and 7 to 10 below still
> describe how the project is built, measured and committed, and still apply.

This document tells you how to build the game from the [design document](game-design-doc.md) with the Goodluck template. Read this document fully before you write code. All sentences use ASD-STE 100 style: short, active, one instruction each.

---

## 1. What Goodluck Is

Goodluck is not a library. You do not install it with `npm install`. Goodluck is a **repository template**. You copy it, you bootstrap it, and then all the code is yours. You can change and delete everything. There are no updates to merge later.

The reference material lives in this repository:

| Path | What it is |
|---|---|
| `goodluck/goodluck` | The template itself, with examples and the build pipeline. |
| `goodluck/backcountry`, `goodluck/mirrorisk`, `goodluck/urwisek` | Finished 3D games made the Goodluck way. |
| `goodluck/potato`, `goodluck/duszki` | Finished 2D games. Not our model, but good pattern references. |

Our game is a 3D FPS. Use the 3D games and the 3D examples as models. `urwisek` is the best full-game reference: it has synth sounds, particles, physics, and a size-optimized build.

---

## 2. The Goodluck Way

Follow these rules in all game code. They are not style preferences. The build pipeline and the size budget depend on them.

### 2.1 ECS architecture

- An **entity** is a number. It is an index into component arrays.
- A **component** is a plain object with data only. No methods. Each component is a TypeScript interface. Component data lives in arrays on the `World` class, one array per component (`game.World.Transform[entity]`).
- `World.Signature[entity]` is a 32-bit bitmask. It says which components the entity has. The `Has` const enum in `world.ts` defines one bit per component. Maximum 32 components.
- A **system** is a free function `sys_foo(game, delta)`. It loops over `World.Signature` with a plain `for` loop and a `QUERY` mask:

  ```ts
  const QUERY = Has.Transform | Has.Move;
  for (let i = 0; i < game.World.Signature.length; i++) {
      if ((game.World.Signature[i] & QUERY) === QUERY) update(game, i, delta);
  }
  ```

- Systems run in a fixed order in `Game.FrameUpdate` in `src/game.ts`. Data flows one way: input systems → physics → game logic → transform → render.

### 2.2 Component mixins and blueprints

- You add a component with a **mixin function**. The mixin returns a thunk `(game, entity) => void` that sets the signature bit and writes the data:

  ```ts
  instantiate(game, [transform([0, 1, 0]), move(10, 2), render_colored_shaded(...)]);
  ```

- A **blueprint** is a function that returns an array of mixins (`blu_*.ts`). Compose blueprints with the spread operator. Child entities go in through the `children(...)` mixin.
- A **scene** (`sce_*.ts`) creates a fresh `World` and instantiates all starting entities.

### 2.3 Naming and the minifier contract

This is the most important rule. Terser mangles **all property names that start with a capital letter** (`--mangle-props regex=/^[A-Z]/`). Therefore:

- Give a capital first letter to every property you own: `Health`, `WaveCount`, `VelocityLinear`.
- Keep lower-case for names the platform owns: `gl.drawElements`, uniform names, DOM APIs.
- When you must keep a capital name literal (web standards like `KeyW`), use a computed accessor: `game.InputState["KeyW"]`, never `game.InputState.KeyW`.
- Use `const enum` for all enums. They compile to bare numbers, zero bytes.
- Guard debug-only code with `if (DEBUG) {...}`. The production build defines `DEBUG=false` and Terser deletes the code.
- Write free functions, not methods. Free functions tree-shake; methods do not.
- Math functions take an `out` parameter first (glMatrix style). Reuse module-level scratch vectors in systems. Do not allocate in the frame loop.

### 2.4 Actions

Cross-cutting game events (player died, wave cleared, item collected) go through `actions.ts`: an `Action` const enum and one `dispatch(game, action, payload)` function with a `switch`. Systems call `dispatch`; UI buttons call `window.$(...)`.

---

## 3. Project Setup

The game code will live at the root of this repository (`src/`, `lib/`, `materials/`, `meshes/`, `play/`). The `goodluck/` folder stays as read-only reference.

Do these steps once:

1. Copy the template content (not the `.git` folder) from `goodluck/goodluck/` into the repository root:
   `rsync -a --exclude .git goodluck/goodluck/ ./` (keep our `README`/docs; resolve the `.gitignore` union by hand).
2. Run the bootstrap script with the example that is closest to our game:
   ```
   ./bootstrap.sh NewProject3D
   ```
   The script deletes the other examples, replaces symlinks with real files from `core/`, renames `NewProject3D` to `src/`, deletes `core/`, and makes a commit. After this step the code is fully ours.
   - Why `NewProject3D`: it already has first-person mouse look, keyboard move, jump, AABB collisions, rigid-body physics, particles, spawn, lifespan, audio systems, and UI. `FirstPerson` is too thin; `DeferredShading` carries a pipeline we will rebuild differently.
3. `npm install`, then `npm start`. Open `http://localhost:1234/src/`. Confirm the example runs.
4. Delete what the game does not need (see §7). Deletion is the main size tool.

Development loop from then on: `npm start` gives esbuild with `DEBUG=true`, sourcemaps, and live rebuild. `npx tsc --noEmit` type-checks.

---

## 4. Build Pipeline and Size Tracking

The optimized build lives in `play/`. Do not change the pipeline; use it.

```
make -C play            # → play/index.html (single file, all inlined)
make -C play index.zip  # → play/index.zip  (7zz + advzip; the 13 KB target)
make -C play clean
RELEASE=1 make -C play index.zip   # slower, smaller: roadroller -O2, advzip iter 10000
```

Pipeline stages (see `play/Makefile`): `tsc --noEmit` (type check) → `esbuild` bundle with `DEBUG=false` → `sed` cleanup → `glsl.cjs` (shader white space and short shader names) → `terser` (mangle toplevel + capital props) → `roadroller` (JS packer) → `posthtml` inlines JS and CSS into one `index.html`. The zip target needs `7zz` and `advzip` (`sudo port install 7zip advancecomp` on macOS).

### 4.1 Bundle size in every commit message

Every commit message ends with the zip size. Format:

```
Add unicorn AI (18432b)
```

Get the number with:

```
make -C play index.zip >/dev/null 2>&1 && stat -f%z play/index.zip
```

Rules:

- Measure before each commit. Use the plain (non-`RELEASE`) zip for day-to-day commits; it is faster and consistent.
- Commits that touch no shipped code (docs, tooling) use the last known size, or `(no bundle)` before the first bootstrap commit.
- Author is the repo default (`michal@virtualdesign.pl`). No co-authors. One short line.
- The first playable does **not** need to be under 13 KB. The number in the log is the burn-down chart. We shrink later (§7).
- Do not commit `play/*.js` or `play/index.html` build artifacts; keep them ignored.

Optional helper (add in the tooling commit): a `commit.sh` that runs the build, reads the size, and appends `(NNNNNb)` to the message. Keep it three lines.

---

## 5. Game Architecture

Map the design document onto ECS pieces. Everything below follows the existing patterns; almost every "new" system is a copy of an existing one with different math.

### 5.1 World and components

Start from the `NewProject3D` component set. Keep: `Transform`, `Children`, `Camera`, `Collide`, `RigidBody`, `Move`, `ControlPlayer`, `Render`, `Light`, `Lifespan`, `Spawn`, `EmitParticles`, `AudioSource`, `Shake`. Delete: `Mimic`, `Toggle`, `Named`, `Animate` (unless animation earns its bytes later), `Draw`, `Task`/`Trigger` if unused.

Add these small components:

| Component | Data | Used by |
|---|---|---|
| `Health` | `Current`, `Max` | player, unicorns, terrain props |
| `ControlAi` | `Kind` (const enum), `Cooldown` | unicorn steering and attacks |
| `Projectile` | `Damage`, `Knockback` | rebar shots |
| `Shatter` | `Generation` (0 = intact, 1 = chunk, 2 = rubble) | destructible props |
| `Pickup` | `Heal` | neon healing pixels |
| `ControlDash` | `Charges`, `Cooldown`, `SlideTimer` | movement tech |

Keep the total component count at or under 32 (it will be far under).

Collision layers in `game.ts`: `Player`, `Terrain`, `Enemy`, `Projectile`, `Pickup`.

### 5.2 Player and movement

- Player entity: `transform` + `control_player` + `control_dash` + `move` + `rigid_body(Dynamic)` + `collide` + `health`, with a child camera entity (`camera_target`, see §6). This is the `blu_camera_fly` / NewProject3D player pattern.
- Keyboard + mouse look: reuse `sys_control_keyboard` and `sys_control_mouse_move` as-is. Keep `input_pointer_lock(game)` in `index.ts`.
- Jump: reuse `sys_control_jump` (`Acceleration[1]` impulse when `IsGrounded`).
- **Air-dash**: new `sys_control_dash`. On dash key with charges left, add a large impulse along the camera forward vector to `RigidBody.Acceleration`. Recharge on `IsGrounded`.
- **Slide**: in the same system. When crouch key is down and speed is high, scale ground friction down and lower the camera child for the slide timer.
- **Weapon knockback**: when the player fires, `dispatch(Action.Fire)` adds an impulse opposite to the aim direction. This is rocket-jump traversal for free — no new system.
- Tune gravity and accelerations in `sys_physics_integrate`. Quake-feel comes from numbers, not from new code.

### 5.3 Weapon and projectiles

- New `sys_control_weapon`: on `Mouse0` with cooldown ready, instantiate a rebar blueprint at the camera muzzle.
- Rebar blueprint: `transform` (thin scaled cylinder) + `render_colored_shaded` (gray, slight emissive) + `move` or straight `RigidBody` velocity + `collide(Projectile)` + `projectile(...)` + `lifespan(2)`.
- New `sys_projectile`: on collision with `Enemy` or `Terrain`, dispatch `Action.Hit(target, damage, point)` and destroy the rebar with `destroy_all`.

### 5.4 Unicorns

- Blueprint `blu_unicorn`: a root with `control_ai` + `move` + `rigid_body` + `collide(Enemy)` + `health`, and children built only from `MeshCube` (body, head) and `MeshCylinder` (four legs, one horn). Materials: near-black diffuse plus a hyper-saturated emissive color per unicorn, and one child `light_point` in the same color. The point light on the enemy is what makes the neon read against the gray concrete.
- `sys_control_ai`: steer toward the player position, hop with impulses, and lunge inside a range. A `switch` on `ControlAi.Kind` covers variants (walker, leaper). No pathfinding; the arena is open.
- Death (`Health.Current <= 0` in `sys_health`): dispatch `Action.EnemyDied(entity, distance_to_player)`. Spawn a burst of neon pickups when the kill is close-range (the push-forward healing rule), plus a colored particle explosion (`emit_particles` + `render_particles_colored`, both already exist).

### 5.5 Waves

- New `sys_director`, driven by fields on `Game` (`WaveNumber`, `Alive`, `Countdown`). Between waves, count down. On wave start, instantiate N unicorns at ring positions around the arena, N and speed scale with `WaveNumber`. This replaces `sys_spawn` for enemies; keep `com_spawn` only if a spawner-entity shape turns out simpler.

### 5.6 Destructible terrain

- Arena props: cubes, cylinders, spheres with `collide(Terrain, static)` + `rigid_body(Static)` + `health` + `shatter(0)`.
- On `Action.Hit` against a prop, drop `Health`. At zero: destroy the prop and instantiate 4–8 children of the next `Generation` — the same mesh at ~40% scale, with `rigid_body(Dynamic)`, random outward velocity, and for generation 2 a `lifespan`. Generation 2 dies for good. The arena degrades exactly as the design document asks, with zero new assets.
- Keep chunk counts low (see the perf note in §8).

### 5.7 Health pickups

- Neon pixel blueprint: tiny emissive cube + `collide(Pickup)` + `pickup(heal)` + `lifespan(5)` + a small initial velocity.
- Collection: handle it in `sys_health` or a 20-line `sys_pickup`; on player contact dispatch `Action.Heal`.

### 5.8 UI and game states

- HUD via the existing `sys_ui` + `lib/html.ts` template strings: health bar, wave number, title screen, death screen. DOM UI costs almost nothing after compression; do not draw HUD in WebGL.
- Game states: a `Game.State` const enum (`Title`, `Playing`, `Dead`). `dispatch(Action.Start)` calls `scene_arena(game)`. Scene restart is "new World()", the cheapest reset there is.

### 5.9 Frame order (`src/game.ts`)

```
sys_control_keyboard / mouse / dash / weapon   // input
sys_control_ai                                 // AI
sys_physics_integrate → sys_transform → sys_collide → sys_physics_resolve → sys_transform
sys_projectile, sys_health, sys_director       // game logic
sys_lifespan, sys_shake, sys_particles, sys_transform
sys_audio_source
sys_resize → sys_camera → sys_light
sys_render_forward (to low-res target) → sys_render_postprocess (upscale + effects)
sys_ui
```

---

## 6. Rendering: the PS1 Horror Look

This is the only part where we assemble something new, and every piece already exists in the reference code.

### 6.1 Low internal resolution

- Do not render to the canvas. Give the camera a **render target**: `camera_target(create_forward_target(gl, 320, 240, false), ...)` — the `CameraTarget` kind in `com_camera.ts` already supports this, and `ForwardShading`'s minimap shows the pattern.
- Add a final blit pass: a fullscreen quad (`mesh_quad`) drawn to the canvas with a tiny postprocess material that samples the 320×240 texture. Create the texture with `GL_NEAREST` filtering. That is the whole "chunky upscale".

### 6.2 Vertex snapping (jitter)

- Fork `mat_forward_colored_gouraud` into `mat_forward_prism`. After computing `gl_Position`, snap it in clip space:

  ```glsl
  vec2 grid = vec2(160.0, 120.0);
  gl_Position.xy = floor(gl_Position.xy / gl_Position.w * grid) / grid * gl_Position.w;
  ```

- One material serves the whole game (arena, unicorns, rebars). One material means one shader string in the bundle — the single largest size lever in the renderer.

### 6.3 Affine texture mapping

- Decision to make early: the game may need **no textures at all** (vertex-lit gray concrete + noise in the grain pass may be enough, and zero texture code is the smallest texture code). If we do want the 64×64 concrete texture:
  - Generate it procedurally at startup into an offscreen 2D canvas (value noise, gray levels), upload with `create_texture_from`. No image asset, no loader.
  - For the affine warp, multiply the UV by `gl_Position.w` in the vertex shader and divide by the interpolated `w` in the fragment shader — the classic trick, 2 lines of GLSL.

### 6.4 Bloom and film grain

- Copy the postprocess chain from `DeferredShading`: `mat_postprocess_brightness` → `mat_postprocess_blur` ping-pong → composite. It runs on our 320×240 target, so it is cheap. Because only emissive neon exceeds the brightness threshold, bloom automatically bleeds only from unicorns and pickups — exactly the design goal.
- Fold film grain and the final upscale into one composite shader: `color += (hash(uv + time) - 0.5) * grain_amount`. One `Now`-driven uniform.
- Skip FXAA and tone-mapping: aliasing is the aesthetic.

### 6.5 Palette discipline

- All world geometry: gray `DiffuseColor`, zero emissive.
- Unicorns, projectile trails, pickups: saturated `EmissiveColor` + point lights.
- Camera clear color: near-black. Fog: use the built-in fog-to-clear-color for depth dread.

---

## 7. Size Strategy (the road from playable to 13 KB)

Phase 1 (playable) ignores the budget but never breaks the contract in §2.3. Phase 2 shrinks. In order of value:

1. **Delete unused code.** After bootstrap, remove unused systems, components, materials, meshes, `lib/` modules (`navmesh`, `pathfind`, `webxr`, `texture` if unused, spare framebuffer kinds). esbuild's `--analyze` output in the `make` log shows what is in the bundle and how big it is. Read it every time.
2. **One material, few meshes.** `mesh_cube`, `mesh_cylinder` (copy from `urwisek/meshes/`), maybe `mesh_icosphere_flat`. Strip unused vertex attributes (weights, texcoords if untextured) from the mesh files.
3. **Procedural everything.** No image, sound, or model files. Textures from canvas noise (or none). Audio from `lib/audio.ts` synths.
4. **Data in numbers, not strings.** Const enums, no string keys in hot data.
5. **`RELEASE=1 make -C play index.zip`** for milestone measurements: roadroller `-O2` and `advzip --iter 10000` claw back real bytes.
6. **Roadroller likes repetition.** Uniform code patterns (identical system loops, mixin shapes) compress far better than clever one-offs. The boring Goodluck way is itself a compression strategy.
7. If still over: shorten the HTML shell, merge systems with identical queries, inline single-use functions, cut a feature. The design document's ordering of cuts: texture first, then extra enemy variants, never movement feel.

## 8. Audio

- Use `lib/audio.ts` synth clips only (`AudioSynthClip`), the `urwisek` `sounds/snd_*.ts` files show the exact shape: an instrument parameter array plus notes. Sounds needed: shot (saw burst), explosion (noise burst), hurt, dash, pickup, unicorn neigh (copy `snd_neigh` from `urwisek` and detune it), and one low drone loop for the arena.
- Play through the existing `com_audio_source` / `sys_audio_source`; positional panner comes free.
- The `AudioContext` needs a user gesture: start it from the title-screen click that also grabs pointer lock.

Performance note: destructible chunks plus particles can spike entity counts. The `for` loop over signatures handles thousands of entities, but each dynamic `RigidBody` is O(n) against colliders. Cap live chunks (recycle the oldest) and give rubble no collider, only a lifespan.

---

## 9. Milestones

Each milestone is one or a few commits, each commit playable (or at least green: `npx tsc --noEmit` passes and `make -C play` succeeds), each with the zip size.

| # | Milestone | Done when |
|---|---|---|
| 0 | Copy template, `./bootstrap.sh NewProject3D`, prune obvious dead weight, first `make -C play index.zip` | Example runs; size in log |
| 1 | Arena scene: floor, brutalist props, gray palette, fog, player walk/look/jump | You can run around concrete |
| 2 | Weapon: rebar projectiles, knockback impulse, hit dispatch | Shooting feels heavy |
| 3 | Unicorns: blueprint, AI chase/lunge, health, death explosion | You can kill and be chased |
| 4 | Waves + player health + close-range heal pickups | Full loop: survive, die, restart |
| 5 | Destructible props: shatter generations | Cover degrades under fire |
| 6 | Movement tech: air-dash, slide | Traversal feels like Devil Daggers |
| 7 | Low-res render target + nearest upscale + vertex snap material | The PS1 look appears |
| 8 | Bloom + film grain composite | Neon bleeds, screen crawls |
| 9 | Synth audio: shot, explosion, neigh, drone | The game is loud |
| 10 | HUD, title/death screens, states | Shippable first playable |
| 11+ | Size phase: delete, merge, `RELEASE=1`, iterate to ≤ 13312 bytes | `play/index.zip` ≤ 13 KB |

---

## 10. Checks

- `npx tsc --noEmit` must pass before every commit (the Makefile enforces it anyway).
- `make -C play index.zip` must succeed before every commit; its size goes in the message.
- Keep one runnable self-check for non-trivial logic where feasible (e.g. a `DEBUG`-guarded assert in `sys_health` that health never exceeds max). `DEBUG` code costs zero bytes in production.
