import {input_pointer_lock} from "../lib/input.js";
import {dispatch} from "./actions.js";
import {Game} from "./game.js";
import {scene_level} from "./level.js";

let game = new Game();
input_pointer_lock(game);

// Build the level straight away so that the title screen has the megastructure
// behind it. Nothing in it moves until Action.Start switches the state.
scene_level(game);
game.Start();

// @ts-ignore
window.$ = dispatch.bind(null, game);

if (DEBUG) {
    // @ts-ignore
    window.game = game;
}
