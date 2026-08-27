import {create_depth_target, create_forward_target, DepthTarget, ForwardTarget} from "../lib/framebuffer.js";
import {Game3D} from "../lib/game.js";
import {
    GL_NEAREST,
    GL_TEXTURE_2D,
    GL_TEXTURE_MAG_FILTER,
    GL_TEXTURE_MIN_FILTER,
} from "../lib/webgl.js";
import {MAX_FORWARD_LIGHTS} from "../materials/light.js";
import {mat_forward_depth} from "../materials/mat_forward_depth.js";
import {mat_forward_particles_colored} from "../materials/mat_forward_particles_colored.js";
import {mat_forward_prism} from "../materials/mat_forward_prism.js";
import {mat_postprocess_prism} from "../materials/mat_postprocess_prism.js";
import {mesh_prism, mesh_quad} from "../meshes/prism.js";
import {sys_audio_listener} from "./systems/sys_audio_listener.js";
import {sys_audio_source} from "./systems/sys_audio_source.js";
import {sys_camera} from "./systems/sys_camera.js";
import {sys_collide} from "./systems/sys_collide.js";
import {sys_control_ai} from "./systems/sys_control_ai.js";
import {sys_control_keyboard} from "./systems/sys_control_keyboard.js";
import {sys_control_mouse_move} from "./systems/sys_control_mouse_move.js";
import {sys_control_move_tech} from "./systems/sys_control_move_tech.js";
import {sys_control_weapon} from "./systems/sys_control_weapon.js";
import {sys_lifespan} from "./systems/sys_lifespan.js";
import {sys_light} from "./systems/sys_light.js";
import {sys_move} from "./systems/sys_move.js";
import {sys_particles} from "./systems/sys_particles.js";
import {sys_physics_integrate} from "./systems/sys_physics_integrate.js";
import {sys_physics_resolve} from "./systems/sys_physics_resolve.js";
import {sys_platform} from "./systems/sys_platform.js";
import {sys_projectile} from "./systems/sys_projectile.js";
import {sys_render_depth} from "./systems/sys_render_depth.js";
import {sys_render_forward} from "./systems/sys_render_forward.js";
import {sys_render_postprocess} from "./systems/sys_render_postprocess.js";
import {sys_resize} from "./systems/sys_resize.js";
import {sys_shake} from "./systems/sys_shake.js";
import {sys_touch} from "./systems/sys_touch.js";
import {sys_transform} from "./systems/sys_transform.js";
import {sys_ui} from "./systems/sys_ui.js";
import {sys_viewmodel} from "./systems/sys_viewmodel.js";
import {World} from "./world.js";

/** The internal resolution everything is rendered at, before the upscale. */
export const RENDER_WIDTH = 320;
export const RENDER_HEIGHT = 240;
/** The sun's shadow map. Square, and big enough to keep the edges hard. */
const SHADOW_SIZE = 1024;

export const enum GameState {
    Title,
    Playing,
    Dead,
    Won,
}

export const enum Layer {
    None = 0,
    Player = 1,
    Terrain = 2,
    Enemy = 4,
    Projectile = 8,
    Pickup = 16,
    Trigger = 32,
}

export class Game extends Game3D {
    World = new World();

    MaterialPrism = mat_forward_prism(this.Gl);
    MaterialParticles = mat_forward_particles_colored(this.Gl);
    MaterialComposite = mat_postprocess_prism(this.Gl);
    MaterialDepth = mat_forward_depth(this.Gl);

    // A four-sided prism of half-diagonal sqrt(1/2) is a unit cube; an
    // eight-sided one is a cylinder chunky enough to look like 1997.
    MeshCube = mesh_prism(this.Gl, 4, Math.SQRT1_2);
    MeshCylinder = mesh_prism(this.Gl, 8, 0.5);
    MeshQuad = mesh_quad(this.Gl);

    override Targets: {Scene: ForwardTarget; Sun: DepthTarget};

    LightPositions = new Float32Array(4 * MAX_FORWARD_LIGHTS);
    LightDetails = new Float32Array(4 * MAX_FORWARD_LIGHTS);

    State = GameState.Title;
    Kills = 0;
    /** How many enemies the level started with. */
    Enemies = 0;

    /** The player rig: yaw, pitch, camera, and the gun hanging off the camera. */
    PlayerEntity = 0;
    PlayerEye = 0;
    PlayerCamera = 0;
    Viewmodel = 0;
    /** The directional light, which is also the shadow map's camera. */
    Sun = 0;

    Weapon = 0;
    Ammo: Array<number> = [];
    /** 1 right after a shot, decaying to 0. Drives the viewmodel kick. */
    Recoil = 0;
    /** Phase of the walk bob. */
    Bob = 0;
    /** Set by the keyboard system when a movement key is down. */
    Walking = false;

    constructor() {
        super();

        this.Targets = {
            Scene: create_forward_target(this.Gl, RENDER_WIDTH, RENDER_HEIGHT, false),
            Sun: create_depth_target(this.Gl, SHADOW_SIZE, SHADOW_SIZE),
        };

        // The whole chunky-upscale effect is this: sample the small target with
        // nearest-neighbour filtering instead of the linear default.
        this.Gl.bindTexture(GL_TEXTURE_2D, this.Targets.Scene.ColorTexture);
        this.Gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
        this.Gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    }

    override FrameUpdate(delta: number) {
        if (this.State === GameState.Playing) {
            // Input.
            sys_control_keyboard(this, delta);
            sys_control_mouse_move(this, delta);
            sys_control_move_tech(this, delta);
            sys_control_weapon(this, delta);

            // AI and moving level parts.
            sys_control_ai(this, delta);
            sys_platform(this, delta);

            // Movement, collisions and physics.
            sys_move(this, delta);
            sys_physics_integrate(this, delta);
            sys_transform(this, delta);
            sys_collide(this, delta);
            sys_physics_resolve(this, delta);
            sys_transform(this, delta);

            // Game logic.
            sys_projectile(this, delta);
            sys_touch(this, delta);

            sys_lifespan(this, delta);
            sys_shake(this, delta);
            sys_viewmodel(this, delta);
            sys_particles(this, delta);
        }

        sys_transform(this, delta);
        sys_audio_listener(this, delta);
        sys_audio_source(this, delta);

        // Rendering.
        sys_resize(this, delta);
        sys_camera(this, delta);
        sys_light(this, delta);
        sys_render_depth(this, delta);
        sys_render_forward(this, delta);
        sys_render_postprocess(this, delta);
        sys_ui(this, delta);
    }
}
