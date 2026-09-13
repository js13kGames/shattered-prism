import {Game} from "./game.js";
import {start} from "./actions.js";
import {scene_level} from "./level.js";

let game = new Game();

// Build the level straight away so that the title screen has the megastructure
// behind it. Nothing in it moves until start() switches the state.
scene_level(game);
game.Start();

// @ts-ignore
window.$ = () => start(game);

if (DEBUG) {
    // @ts-ignore
    window.game = game;
}
