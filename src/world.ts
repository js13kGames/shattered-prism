import {WorldImpl} from "../lib/world.js";
import {AudioSource} from "./components/com_audio_source.js";
import {Camera} from "./components/com_camera.js";
import {Children} from "./components/com_children.js";
import {Collide} from "./components/com_collide.js";
import {ControlPlayer} from "./components/com_control_player.js";
import {EmitParticles} from "./components/com_emit_particles.js";
import {
    ControlAi,
    Health,
    Pickup,
    Platform,
    Projectile,
    Shatter,
    Trigger,
} from "./components/com_gameplay.js";
import {Lifespan} from "./components/com_lifespan.js";
import {Light} from "./components/com_light.js";
import {Move} from "./components/com_move.js";
import {Render} from "./components/com_render.js";
import {RigidBody} from "./components/com_rigid_body.js";
import {Shake} from "./components/com_shake.js";
import {Transform} from "./components/com_transform.js";

const enum Component {
    AudioListener,
    AudioSource,
    Camera,
    Children,
    Collide,
    ControlAi,
    ControlPlayer,
    Dirty,
    EmitParticles,
    Health,
    Lifespan,
    Light,
    Move,
    Pickup,
    Platform,
    Projectile,
    Render,
    RigidBody,
    Shake,
    Shatter,
    Transform,
    Trigger,
}

export const enum Has {
    None = 0,
    AudioListener = 1 << Component.AudioListener,
    AudioSource = 1 << Component.AudioSource,
    Camera = 1 << Component.Camera,
    Children = 1 << Component.Children,
    Collide = 1 << Component.Collide,
    ControlAi = 1 << Component.ControlAi,
    ControlPlayer = 1 << Component.ControlPlayer,
    Dirty = 1 << Component.Dirty,
    EmitParticles = 1 << Component.EmitParticles,
    Health = 1 << Component.Health,
    Lifespan = 1 << Component.Lifespan,
    Light = 1 << Component.Light,
    Move = 1 << Component.Move,
    Pickup = 1 << Component.Pickup,
    Platform = 1 << Component.Platform,
    Projectile = 1 << Component.Projectile,
    Render = 1 << Component.Render,
    RigidBody = 1 << Component.RigidBody,
    Shake = 1 << Component.Shake,
    Shatter = 1 << Component.Shatter,
    Transform = 1 << Component.Transform,
    Trigger = 1 << Component.Trigger,
}

export class World extends WorldImpl {
    AudioSource: Array<AudioSource> = [];
    Camera: Array<Camera> = [];
    Children: Array<Children> = [];
    Collide: Array<Collide> = [];
    ControlAi: Array<ControlAi> = [];
    ControlPlayer: Array<ControlPlayer> = [];
    EmitParticles: Array<EmitParticles> = [];
    Health: Array<Health> = [];
    Lifespan: Array<Lifespan> = [];
    Light: Array<Light> = [];
    Move: Array<Move> = [];
    Pickup: Array<Pickup> = [];
    Platform: Array<Platform> = [];
    Projectile: Array<Projectile> = [];
    Render: Array<Render> = [];
    RigidBody: Array<RigidBody> = [];
    Shake: Array<Shake> = [];
    Shatter: Array<Shatter> = [];
    Transform: Array<Transform> = [];
    Trigger: Array<Trigger> = [];
}
