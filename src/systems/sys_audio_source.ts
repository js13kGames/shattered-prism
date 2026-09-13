/**
 * # sys_audio_source
 *
 * Play audio clips from entities with [`AudioSource`](com_audio_source.html).
 */

import {play_clip} from "../../lib/audio.js";
import {mat4_get_translation} from "../../lib/mat4.js";
import {Entity} from "../../lib/world.js";
import {Game} from "../game.js";
import {Has} from "../world.js";

const QUERY = Has.AudioSource | Has.Transform;

export function sys_audio_source(game: Game, delta: number) {
    for (let i = 0; i < game.World.Signature.length; i++) {
        if ((game.World.Signature[i] & QUERY) === QUERY) {
            update(game, i, delta);
        }
    }
}

function update(game: Game, entity: Entity, delta: number) {
    let audio_source = game.World.AudioSource[entity];

    if (audio_source.Current) {
        audio_source.Time += delta;
        if (audio_source.Time > audio_source.Current.Exit) {
            // This clip can now be exited from. Note: We might clear Current
            // before the clip actually ends, if Exit < duration. That's OK, as
            // we don't attempt to stop the current audio anyways.
            audio_source.Current = undefined;
        }
    }

    if (audio_source.Trigger && !audio_source.Current) {
        play_clip(game.Audio, audio_source.Panner, audio_source.Trigger);
        audio_source.Current = audio_source.Trigger;
        audio_source.Time = 0;
    }

    if (audio_source.Panner) {
        // Only the position matters. The panner's cone is a full circle by
        // default, so its orientation changes nothing that you can hear.
        audio_source.Panner.setPosition(
            ...mat4_get_translation([0, 0, 0], game.World.Transform[entity].World),
        );
    }

    // Audio triggers are only valid in the frame they're set; they don't stack
    // up. Otherwise sound effects would go out of sync with the game logic.
    // Reset the trigger to the default or undefined, regardless of whether it
    // triggered a new clip to play.
    audio_source.Trigger = audio_source.Idle;
}
