import {html} from "../../lib/html.js";
import {Action} from "../actions.js";
import {Game, GameState} from "../game.js";
import {Has} from "../world.js";

/**
 * The whole UI. It is DOM, not WebGL: after compression a few hundred bytes of
 * markup costs less than the code to draw a health bar with triangles.
 */
export function App(game: Game) {
    if (game.State === GameState.Playing) {
        return Hud(game);
    }
    return Screen(game);
}

const PANEL = `
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 3vmin;
    text-align: center;
    background: radial-gradient(circle, rgba(0,0,0,.55), rgba(0,0,0,.92));
    color: #d8d8dd;
    font: 2.4vmin monospace;
    letter-spacing: .3em;
    text-transform: uppercase;
`;

const BUTTON = `
    padding: 1.6vmin 3vmin;
    border: 1px solid #f0f;
    background: #000;
    color: #f0f;
    font: 2.2vmin monospace;
    letter-spacing: .3em;
    text-transform: uppercase;
`;

function Screen(game: Game) {
    let dead = game.State === GameState.Dead;
    return html`
        <div style="${PANEL}">
            <div style="font-size: 7vmin; color: ${dead ? "#f0f" : "#0ff"}; letter-spacing: .5em">
                ${dead ? "Shattered" : "Shattered Prism"}
            </div>
            <div>
                ${dead
                    ? `Wave ${game.Wave} &middot; ${game.Kills} unicorns unmade`
                    : "Something is loose in the megastructure"}
            </div>
            <div style="opacity: .55; letter-spacing: .18em">
                WASD move &middot; mouse look &middot; click fire<br />
                space jump, again in the air to dash &middot; shift slide<br />
                kill up close to bleed them for health
            </div>
            <button style="${BUTTON}" onclick="$(${Action.Start})">
                ${dead ? "Go back in" : "Enter"}
            </button>
        </div>
    `;
}

function Hud(game: Game) {
    let health = game.World.Signature[game.PlayerEntity] & Has.Health
        ? game.World.Health[game.PlayerEntity]
        : {Current: 0, Max: 1};
    let ratio = Math.max(0, health.Current / health.Max);
    // The bar goes from cyan to magenta as it empties, so the colour alone
    // tells the player how much trouble they are in.
    let hue = 180 + (1 - ratio) * 120;

    return html`
        <div
            style="
                position: absolute;
                inset: 0;
                pointer-events: none;
                color: #d8d8dd;
                font: 2vmin monospace;
                letter-spacing: .3em;
                text-transform: uppercase;
                text-shadow: 0 0 1vmin #000;
            "
        >
            <div style="position: absolute; top: 2vmin; left: 2.5vmin">Wave ${game.Wave}</div>
            <div style="position: absolute; top: 2vmin; right: 2.5vmin">${game.Kills} kills</div>
            <div style="position: absolute; top: 2vmin; left: 0; right: 0; text-align: center; opacity: .5">
                ${game.Alive ? `${game.Alive} left` : "&nbsp;"}
            </div>

            <div
                style="
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 3px;
                    height: 3px;
                    margin: -1.5px 0 0 -1.5px;
                    background: #fff;
                    opacity: .8;
                "
            ></div>

            <div
                style="
                    position: absolute;
                    bottom: 3vmin;
                    left: 25%;
                    width: 50%;
                    height: 1.2vmin;
                    border: 1px solid rgba(255,255,255,.25);
                "
            >
                <div
                    style="
                        width: ${(ratio * 100).toFixed(1)}%;
                        height: 100%;
                        background: hsl(${hue.toFixed(0)}, 100%, 55%);
                        box-shadow: 0 0 2vmin hsl(${hue.toFixed(0)}, 100%, 55%);
                    "
                ></div>
            </div>
        </div>
    `;
}
