# Game Design Document: Shattered Prism

## 1. Core Concept

**Shattered Prism** is a first-person shooter in the style of the middle 1990s.
The player moves through a labyrinth inside a bleak, brutalist megastructure. In
the labyrinth are nightmarish, geometric unicorns that bleed toxic neon.

The game is built from primitive shapes only. There are no model files, no
texture files and no sound files. Everything is made in code. This keeps the
whole game in one small HTML file.

---

## 2. Visual Identity and Post-Processing

The art direction uses the limits of early 3D hardware on purpose.

* **Low internal resolution.** The game renders at 320x240 and is scaled up to
  the window with nearest-neighbour filtering. The result is chunky and
  pixelated without any texture data.
* **Vertex snapping.** Vertex positions are rounded to a coarse grid in clip
  space. Models shake and snap as the camera moves, like PS1 hardware.
* **Procedural surface grain.** A hash of the world position stands in for a
  concrete texture. It costs no memory and no load time.
* **High-contrast palette.** The structure is strictly grey concrete. The only
  colours are the hyper-saturated neon of the unicorns, their attacks, the lamps
  and the pickups.
* **Shadows.** One directional sun casts real shadows through a shadow map. The
  labyrinth is roofed in most places, so the sun only enters where the structure
  is open to the sky. Those places are bright, and everywhere else is lit by
  lamps.
* **Bloom and grain.** Bloom is applied only to what is brighter than the
  concrete, so only the neon bleeds. Film grain covers the whole screen.

---

## 3. World and Level

* **Brutalist architecture.** The level is built from boxes and cylinders.
* **Labyrinth layout.** Rooms, corridors, a courtyard open to the sky, a
  balcony one storey up, and a pit in the north. The player must find the exit.
* **Stairs.** Floors are set at levels of 0.6 units. A run of rising cells is a
  staircase. The player climbs steps automatically.
* **Elevators.** A platform rises when the player comes near, holds at the top,
  and returns. It carries the player.
* **Jump pads.** A pad throws the player up and forward. Pads cross the pit, and
  a pad at the bottom of the pit throws the player out again.
* **Destructible cover.** Crates break into smaller pieces when shot. The pieces
  are still cover, and then they break into rubble that lands and disappears.

---

## 4. Enemies

All enemies are built from intersecting boxes and cylinders. Their bodies are
near-black. Only the horn, the eyes and the vents glow.

| Enemy | Shape | Behaviour |
|---|---|---|
| Sentinel | Heavy quadruped, armour plates, long horn | Walks a route. Charges and gores. |
| Gunner | Upright biped with a cannon for an arm | Walks a route. Holds range, strafes, and shoots bolts. |
| Hound | Long, low, four thin legs, forward horn | Holds a post. Very fast. Bounds as it runs. |

### Awareness

Each enemy is in one of three states.

* **Patrol.** It walks its fixed route and ignores the player.
* **Engage.** It has a clear line of sight to the player. It attacks.
* **Search.** It has lost sight. It goes to the place it last saw the player,
  then returns to its route.

The line of sight is a ray against the level geometry. A wall really does hide
the player.

---

## 5. Weapons

The player carries three weapons and changes between them with 1, 2, 3 or the
mouse wheel. Each weapon is visible in the player's hands. The model bobs as the
player walks and kicks when it fires.

| Weapon | Ammo | Behaviour |
|---|---|---|
| Rebar | Unlimited | One heavy concrete slug. Hard knockback. |
| Shredder | Boxes of 45 | Three fast slugs per shot, with spread. |
| Mortar | Boxes of 6 | An arcing shell that explodes. It hurts the player too. |

The knockback is also a movement tool. Aim at the floor and fire the mortar to
launch yourself.

---

## 6. Movement

Movement is inspired by *Quake*. The player can:

* walk and jump,
* air-dash once per jump in the direction of the aim,
* slide along the ground,
* climb steps up to 0.75 units without jumping,
* ride lifts and jump pads.

---

## 7. The Loop

Enter the megastructure. Find the exit. Anything that sees you comes for you.
Kill a unicorn close to you and it drops neon that heals you, which pushes the
player forward rather than back.

---

## 8. Size Strategy

* **No imported assets.** One function generates every mesh. One material draws
  every surface. Sounds are synthesised from parameter arrays.
* **Merged level geometry.** Cells of the level grid are merged into as few
  boxes as possible before they become entities.
* **Const enums and free functions,** so the minifier can do its work.
