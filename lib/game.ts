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
        let ui = <K extends keyof HTMLElementEventMap>(
            type: K,
            listener: (evt: HTMLElementEventMap[K]) => void,
        ) => this.Ui.addEventListener(type, listener);

        ui("contextmenu", (evt) => evt.preventDefault());
        ui("click", () => this.Ui.requestPointerLock());
        ui("mousedown", (evt) => (this.InputState["Mouse" + evt.button] = 1));
        ui("mouseup", (evt) => (this.InputState["Mouse" + evt.button] = 0));
        ui("mousemove", (evt) => {
            this.InputDelta["MouseX"] = evt.movementX;
            this.InputDelta["MouseY"] = evt.movementY;
        });
        ui("wheel", (evt) => {
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
            // The browser stops animation frames in a hidden tab, so the
            // first frame back can be minutes late. Cap the step: a huge one
            // would push the player through the floor.
            let delta = Math.min((now - last) / 1000, 0.1);
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
