/**
 * # Sounds
 *
 * Every sound in the game is synthesised from the instrument parameters in
 * [`lib/audio`](lib_audio.html). There are no audio files.
 *
 * An instrument is
 * `[gain, filter, filter_freq, filter_q, filter_lfo, lfo_type, lfo_amount,
 *   lfo_freq, sources]`, and a source is either an oscillator
 * `[type, gain, attack, sustain, release, detune, ...]` or noise
 * `[false, gain, attack, sustain, release]`.
 */

import {AudioClip, Instrument} from "../lib/audio.js";

/** A one-shot: one instrument playing one note. */
function sfx(instrument: Instrument, note: number, exit: number): AudioClip {
    return {Tracks: [{Instrument: instrument, Notes: [note]}], Exit: exit};
}

/** Firing a rebar: a saw crack over a noise thump. */
export let snd_shoot = sfx(
    [
        6,
        "lowpass",
        11,
        3,
        ,
        ,
        ,
        ,
        [
            ["sawtooth", 8, 0, 1, 3, 6, , true, 1, 1, 4],
            [false, 7, 0, 0, 3],
        ],
    ],
    45,
    0.1,
);

/** A unicorn coming apart: a wide noise burst. */
export let snd_explode = sfx([7, "lowpass", 10, 2, , , , , [[false, 9, 0, 2, 5]]], 40, 0.35);

/** Rebar biting concrete: a short, dry tick. */
export let snd_hit = sfx([4, "highpass", 9, 2, , , , , [[false, 6, 0, 0, 2]]], 60, 0.08);

/** Taking a hit: a low, ugly square. */
export let snd_hurt = sfx(
    [
        6,
        "lowpass",
        9,
        4,
        ,
        ,
        ,
        ,
        [
            ["square", 8, 0, 1, 4, 5],
            [false, 6, 0, 1, 3],
        ],
    ],
    33,
    0.3,
);

/** Air-dash: a filtered rush of air. */
export let snd_dash = sfx([5, "bandpass", 10, 5, , , , , [[false, 8, 1, 0, 3]]], 50, 0.15);

/** Neon pixel collected: a bright ping. */
export let snd_pickup = sfx(
    [4, , , , , , , , [["sine", 7, 0, 1, 3, 9, , true, 0, 1, 3]]],
    88,
    0.12,
);

/** The shredder: a dry, fast tick. */
export let snd_shred = sfx(
    [
        4,
        "highpass",
        10,
        2,
        ,
        ,
        ,
        ,
        [
            [false, 7, 0, 0, 2],
            ["square", 5, 0, 0, 2, 5],
        ],
    ],
    64,
    0.06,
);

/** The mortar leaving the tube: a low, hollow thump. */
export let snd_mortar = sfx(
    [
        7,
        "lowpass",
        8,
        4,
        ,
        ,
        ,
        ,
        [
            ["sine", 8, 0, 1, 4, 4, , true, 0, 1, 4],
            [false, 6, 0, 1, 3],
        ],
    ],
    31,
    0.25,
);

/** The mortar landing. */
export let snd_boom = sfx(
    [
        8,
        "lowpass",
        9,
        3,
        ,
        ,
        ,
        ,
        [
            [false, 9, 0, 2, 6],
            ["sawtooth", 6, 0, 1, 5, 3],
        ],
    ],
    28,
    0.5,
);

/** An empty chamber. */
export let snd_dry = sfx([3, "highpass", 11, 3, , , , , [[false, 5, 0, 0, 1]]], 72, 0.06);

/** Changing weapon: a mechanical clack. */
export let snd_switch = sfx(
    [
        4,
        "bandpass",
        10,
        4,
        ,
        ,
        ,
        ,
        [
            [false, 6, 0, 0, 2],
            ["square", 4, 0, 0, 2, 8],
        ],
    ],
    55,
    0.1,
);

/** A gunner's bolt. */
export let snd_bolt = sfx(
    [4, "bandpass", 10, 6, , , , , [["sawtooth", 6, 0, 1, 3, 10, , true, 1, 1, 3]]],
    69,
    0.18,
);

/** A jump pad throwing you into the air. */
export let snd_pad = sfx(
    [5, "bandpass", 9, 5, , , , , [["sine", 8, 0, 1, 4, 6, , true, 1, 2, 4]]],
    52,
    0.3,
);

/** The neigh: noise pushed through a filter that a saw LFO detunes. */
export let snd_neigh = sfx(
    [4, "lowpass", 9, 5, true, "sawtooth", 7, 9, [[false, 7, 1, 2, 5]]],
    57,
    0.9,
);

/**
 * The arena drone. Two slow tracks, played on a loop as the player's idle clip:
 * a low pad that never resolves, and a sparse metallic knock above it.
 */
export let snd_drone: AudioClip = {
    BPM: 40,
    Tracks: [
        {
            Instrument: [
                4,
                "lowpass",
                8,
                3,
                true,
                "sine",
                4,
                2,
                [
                    ["sawtooth", 7, 6, 6, 8, 7.5, true],
                    ["triangle", 5, 6, 6, 8, 4],
                ],
            ],
            Notes: [26, , , , , , , , 27, , , , , , , , 26, , , , , , , , 24],
        },
        {
            Instrument: [3, "bandpass", 11, 6, , , , , [[false, 5, 0, 0, 3]]],
            Notes: [70, , , , , , , , , , , , 70, , , , , , 70, , , , , , 70],
        },
    ],
    // 25 sixteenths at 40 BPM. Exit is the loop length, so it repeats without
    // a gap when it is used as an idle clip.
    Exit: 9.37,
};
