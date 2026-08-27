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

import {AudioClipKind, AudioSynthClip} from "../lib/audio.js";

/** Firing a rebar: a saw crack over a noise thump. */
export let snd_shoot: AudioSynthClip = {
    Kind: AudioClipKind.Synth,
    Tracks: [
        {
            Instrument: [
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
            Notes: [45],
        },
    ],
    Exit: 0.1,
};

/** A unicorn coming apart: a wide noise burst. */
export let snd_explode: AudioSynthClip = {
    Kind: AudioClipKind.Synth,
    Tracks: [
        {
            Instrument: [7, "lowpass", 10, 2, , , , , [[false, 9, 0, 2, 5]]],
            Notes: [40],
        },
    ],
    Exit: 0.35,
};

/** Rebar biting concrete: a short, dry tick. */
export let snd_hit: AudioSynthClip = {
    Kind: AudioClipKind.Synth,
    Tracks: [
        {
            Instrument: [4, "highpass", 9, 2, , , , , [[false, 6, 0, 0, 2]]],
            Notes: [60],
        },
    ],
    Exit: 0.08,
};

/** Taking a hit: a low, ugly square. */
export let snd_hurt: AudioSynthClip = {
    Kind: AudioClipKind.Synth,
    Tracks: [
        {
            Instrument: [
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
            Notes: [33],
        },
    ],
    Exit: 0.3,
};

/** Air-dash: a filtered rush of air. */
export let snd_dash: AudioSynthClip = {
    Kind: AudioClipKind.Synth,
    Tracks: [
        {
            Instrument: [5, "bandpass", 10, 5, , , , , [[false, 8, 1, 0, 3]]],
            Notes: [50],
        },
    ],
    Exit: 0.15,
};

/** Neon pixel collected: a bright ping. */
export let snd_pickup: AudioSynthClip = {
    Kind: AudioClipKind.Synth,
    Tracks: [
        {
            Instrument: [4, , , , , , , , [["sine", 7, 0, 1, 3, 9, , true, 0, 1, 3]]],
            Notes: [88],
        },
    ],
    Exit: 0.12,
};

/** The neigh: noise pushed through a filter that a saw LFO detunes. */
export let snd_neigh: AudioSynthClip = {
    Kind: AudioClipKind.Synth,
    Tracks: [
        {
            Instrument: [4, "lowpass", 9, 5, true, "sawtooth", 7, 9, [[false, 7, 1, 2, 5]]],
            Notes: [57],
        },
    ],
    Exit: 0.9,
};

/**
 * The arena drone. Two slow tracks, played on a loop as the player's idle clip:
 * a low pad that never resolves, and a sparse metallic knock above it.
 */
export let snd_drone: AudioSynthClip = {
    Kind: AudioClipKind.Synth,
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
    Exit: 18,
};
