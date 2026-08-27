import {create_forward_target, ForwardTarget} from "../lib/framebuffer.js";
import {Game3D} from "../lib/game.js";
import {GL_NEAREST, GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_TEXTURE_MIN_FILTER} from "../lib/webgl.js";
import {MAX_FORWARD_LIGHTS} from "../materials/light.js";
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
import {sys_director} from "./systems/sys_director.js";
import {sys_lifespan} from "./systems/sys_lifespan.js";
import {sys_light} from "./systems/sys_light.js";
import {sys_move} from "./systems/sys_move.js";
import {sys_particles} from "./systems/sys_particles.js";
import {sys_physics_integrate} from "./systems/sys_physics_integrate.js";
import {sys_physics_resolve} from "./systems/sys_physics_resolve.js";
import {sys_pickup} from "./systems/sys_pickup.js";
import {sys_projectile} from "./systems/sys_projectile.js";
import {sys_render_forward} from "./systems/sys_render_forward.js";
import {sys_render_postprocess} from "./systems/sys_render_postprocess.js";
import {sys_resize} from "./systems/sys_resize.js";
import {sys_shake} from "./systems/sys_shake.js";
import {sys_transform} from "./systems/sys_transform.js";
import {sys_ui} from "./systems/sys_ui.js";
import {World} from "./world.js";

/** The internal resolution everything is rendered at, before the upscale. */
export const RENDER_WIDTH = 320;
export const RENDER_HEIGHT = 240;

export const enum GameState {
    Title,
    Playing,
    Dead,
}

export const enum Layer {
    None = 0,
    Player = 1,
    Terrain = 2,
    Enemy = 4,
    Projectile = 8,
    Pickup = 16,
}

export class Game extends Game3D {
    World = new World();

    MaterialPrism = mat_forward_prism(this.Gl);
    MaterialParticles = mat_forward_particles_colored(this.Gl);
    MaterialComposite = mat_postprocess_prism(this.Gl);

    // A four-sided prism of half-diagonal sqrt(1/2) is a unit cube; an
    // eight-sided one is a cylinder chunky enough to look like 1997.
    MeshCube = mesh_prism(this.Gl, 4, Math.SQRT1_2);
    MeshCylinder = mesh_prism(this.Gl, 8, 0.5);
    MeshQuad = mesh_quad(this.Gl);

    override Targets: {Scene: ForwardTarget};

    LightPositions = new Float32Array(4 * MAX_FORWARD_LIGHTS);
    LightDetails = new Float32Array(4 * MAX_FORWARD_LIGHTS);

    State = GameState.Title;
    /** The wave now running, 1-based. */
    Wave = 0;
    /** Unicorns still alive in this wave. */
    Alive = 0;
    /** Seconds until the next wave starts. */
    Countdown = 3;
    Kills = 0;

    /** The player rig, its pitch child, and the camera under that. */
    PlayerEntity = 0;
    PlayerEye = 0;
    PlayerCamera = 0;

    constructor() {
        super();

        this.Targets = {
            Scene: create_forward_target(this.Gl, RENDER_WIDTH, RENDER_HEIGHT, false),
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

            // AI.
            sys_control_ai(this, delta);

            // Movement, collisions and physics.
            sys_move(this, delta);
            sys_physics_integrate(this, delta);
            sys_transform(this, delta);
            sys_collide(this, delta);
            sys_physics_resolve(this, delta);
            sys_transform(this, delta);

            // Game logic.
            sys_projectile(this, delta);
            sys_pickup(this, delta);
            sys_director(this, delta);

            sys_lifespan(this, delta);
            sys_shake(this, delta);
            sys_particles(this, delta);
        }

        sys_transform(this, delta);
        sys_audio_listener(this, delta);
        sys_audio_source(this, delta);

        // Rendering.
        sys_resize(this, delta);
        sys_camera(this, delta);
        sys_light(this, delta);
        sys_render_forward(this, delta);
        sys_render_postprocess(this, delta);
        sys_ui(this, delta);
    }
}
