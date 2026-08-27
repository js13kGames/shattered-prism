import {html} from "../../lib/html.js";
import {Action} from "../actions.js";
import {Game, GameState} from "../game.js";
import {WEAPONS} from "../weapons.js";
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
    gap: 2.6vmin;
    text-align: center;
    background: radial-gradient(circle, rgba(0,0,0,.55), rgba(0,0,0,.93));
    color: #d8d8dd;
    font: 2.2vmin monospace;
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
    let title = "Shattered Prism";
    let colour = "#0ff";
    let line = "Something is loose in the megastructure";
    let button = "Enter";

    if (game.State === GameState.Dead) {
        title = "Shattered";
        colour = "#f0f";
        line = `${game.Kills} of ${game.Enemies} unmade &middot; you did not get out`;
        button = "Go back in";
    } else if (game.State === GameState.Won) {
        title = "Out";
        colour = "#0f8";
        line = `${game.Kills} of ${game.Enemies} unmade &middot; the structure holds`;
        button = "Again";
    }

    return html`
        <div style="${PANEL}">
            <div style="font-size: 6.5vmin; color: ${colour}; letter-spacing: .5em">${title}</div>
            <div>${line}</div>
            <div style="opacity: .55; letter-spacing: .18em; line-height: 1.9">
                WASD move &middot; mouse look &middot; click fire &middot; 1 2 3 or wheel to swap<br />
                space jump, again in the air to dash &middot; shift slide<br />
                they only come for you once they see you &middot; find the green door
            </div>
            <button style="${BUTTON}" onclick="$(${Action.Start})">${button}</button>
        </div>
    `;
}

function Hud(game: Game) {
    let health = game.World.Signature[game.PlayerEntity] & Has.Health
        ? game.World.Health[game.PlayerEntity]
        : {Current: 0, Max: 1};
    let ratio = Math.max(0, health.Current / health.Max);
    // The bar runs from cyan to magenta as it empties, so the colour alone
    // tells you how much trouble you are in.
    let hue = (180 + (1 - ratio) * 120).toFixed(0);
    let weapon = WEAPONS[game.Weapon];
    let ammo = weapon.MaxAmmo ? `${game.Ammo[game.Weapon]}` : "&infin;";

    return html`
        <div
            style="
                position: absolute;
                inset: 0;
                pointer-events: none;
                color: #d8d8dd;
                font: 1.9vmin monospace;
                letter-spacing: .3em;
                text-transform: uppercase;
                text-shadow: 0 0 1vmin #000;
            "
        >
            <div style="position: absolute; top: 2vmin; left: 2.5vmin">
                ${game.Kills} / ${game.Enemies} unmade
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
                    opacity: .85;
                "
            ></div>

            <div style="position: absolute; right: 2.5vmin; bottom: 2.6vmin; text-align: right">
                <div style="font-size: 3.4vmin; color: hsl(${hue}, 100%, 62%)">${ammo}</div>
                <div style="opacity: .7">${weapon.Name}</div>
                <div style="opacity: .35; font-size: 1.5vmin; margin-top: .6vmin">
                    ${WEAPONS.map(
                        (w, i) =>
                            `<span style="opacity:${i === game.Weapon ? 1 : 0.4}">${i + 1}</span>`,
                    ).join(" ")}
                </div>
            </div>

            <div
                style="
                    position: absolute;
                    bottom: 3vmin;
                    left: 3vmin;
                    width: 34%;
                    height: 1.2vmin;
                    border: 1px solid rgba(255,255,255,.25);
                "
            >
                <div
                    style="
                        width: ${(ratio * 100).toFixed(1)}%;
                        height: 100%;
                        background: hsl(${hue}, 100%, 55%);
                        box-shadow: 0 0 2vmin hsl(${hue}, 100%, 55%);
                    "
                ></div>
            </div>
        </div>
    `;
}
