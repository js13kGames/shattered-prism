import {GL_CULL_FACE, GL_CW, GL_DEPTH_TEST, GL_ONE_MINUS_SRC_ALPHA, GL_SRC_ALPHA} from "./webgl.js";
import {Entity, WorldImpl, create_entity} from "./world.js";

/**
 * The base Game class. It runs the main loop and records the input state.
 */
export abstract class GameImpl {
    Running = 0;
    Now = 0;

    abstract World: WorldImpl;

    ViewportWidth = window.innerWidth;
    ViewportHeight = window.innerHeight;
    ViewportResized = true;

    // State of input during this frame. 1 = down, 0 = up.
    InputState: Record<string, number> = {};
    // Changes of input right before this frame. 1 = pressed, -1 = released,
    // or the raw amount for the mouse and the wheel.
    InputDelta: Record<string, number> = {};

    Ui = document.querySelector("main")!;
    SceneCanvas = document.querySelector("canvas")!;
    Gl = this.SceneCanvas.getContext("webgl2")!;
    Audio = new AudioContext();

    constructor() {
        document.addEventListener("visibilitychange", () =>
            document.hidden ? this.Stop() : this.Start(),
        );

        this.Ui.addEventListener("contextmenu", (evt) => evt.preventDefault());
        this.Ui.addEventListener("click", () => this.Ui.requestPointerLock());

        this.Ui.addEventListener("mousedown", (evt) => {
            this.InputState["Mouse" + evt.button] = 1;
        });
        this.Ui.addEventListener("mouseup", (evt) => {
            this.InputState["Mouse" + evt.button] = 0;
        });
        this.Ui.addEventListener("mousemove", (evt) => {
            this.InputDelta["MouseX"] = evt.movementX;
            this.InputDelta["MouseY"] = evt.movementY;
        });
        this.Ui.addEventListener("wheel", (evt) => {
            evt.preventDefault();
            this.InputDelta["WheelY"] = evt.deltaY;
        });

        window.addEventListener("keydown", (evt) => {
            if (!evt.repeat) {
                this.InputState[evt.code] = 1;
                this.InputDelta[evt.code] = 1;
            }
        });
        window.addEventListener("keyup", (evt) => {
            this.InputState[evt.code] = 0;
            this.InputDelta[evt.code] = -1;
        });

        this.Gl.enable(GL_DEPTH_TEST);
        this.Gl.enable(GL_CULL_FACE);
        // Every mesh in the game is wound clockwise seen from outside.
        this.Gl.frontFace(GL_CW);
        this.Gl.blendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    }

    Start() {
        let last = performance.now();

        let tick = (now: number) => {
            let delta = (now - last) / 1000;
            last = this.Now = now;

            this.Running = requestAnimationFrame(tick);

            this.FrameUpdate(delta);

            this.ViewportResized = false;
            for (let name in this.InputDelta) {
                this.InputDelta[name] = 0;
            }

            if (DEBUG) {
                document.getElementById("update")!.textContent = (
                    performance.now() - now
                ).toFixed(1);
                document.getElementById("delta")!.textContent = (delta * 1000).toFixed(1);
                document.getElementById("fps")!.textContent = (1 / delta).toFixed();
            }
        };

        requestAnimationFrame(tick);
    }

    Stop() {
        cancelAnimationFrame(this.Running);
        this.Running = 0;
    }

    abstract FrameUpdate(delta: number): void;
}

type Mixin<G extends GameImpl> = (game: G, entity: Entity) => void;
export type Blueprint<G extends GameImpl> = Array<Mixin<G>>;

export function instantiate<G extends GameImpl>(game: G, blueprint: Blueprint<G>) {
    let entity = create_entity(game.World);
    for (let mixin of blueprint) {
        mixin(game, entity);
    }
    return entity;
}
