// Shrink the GLSL strings in the bundle.
//
// Shaders stay readable in the source. At build time:
//
// 1. GLSL needs a line break only after a preprocessor directive, and #version
//    is the only one the game uses, so the rest of each shader becomes one line
//    with no spaces around punctuation.
// 2. Every name a shader declares (uniforms, inputs, outputs, constants and
//    locals) of three characters or more gets a short name. The same map
//    applies to all shaders, so a vertex output still matches the fragment
//    input of the same name, and to the getUniformLocation and
//    getAttribLocation strings in the JavaScript.
const fs = require("fs");

const SHADER = /(["`])#version 300 es(?:\\n|\n)((?:[^"`\\]|\\.)*?)\1/g;
// A uniform is looked up through a local helper, uniform("name"); an attribute
// directly, with gl.getAttribLocation(program, "name").
const LOOKUP = /((?:\buniform\(|getAttribLocation\(\w+, )")(\w+)(")/g;

let js = fs.readFileSync(0, "utf8");
let shaders = [];

js = js.replace(SHADER, (all, quote, body) => {
    let glsl = body
        .replace(/\\n|\n/g, " ")
        .replace(/\s+/g, " ")
        .replace(/ ?([\[\]{}();,=+\-*/<>!&|?:.]) ?/g, "$1")
        // 1.0 is 1. and 0.5 is .5. The digits inside ${...} are JavaScript.
        .replace(/\$\{[^}]*\}|(\d)\.0+(?!\d)|\b0\.(?=\d)/g, (all, digit) =>
            all.startsWith("${") ? all : digit !== undefined ? digit + "." : ".",
        )
        .trim();
    shaders.push(glsl);
    return quote + "#version 300 es\\n\0" + (shaders.length - 1) + "\0" + quote;
});

if (shaders.length === 0) {
    console.error("glsl.cjs: no shaders found");
    process.exit(1);
}

// Count the declared names, most used first.
const DECLARATION =
    /(?:\b(?:uniform|in|out|const)\s+(?:(?:lowp|mediump|highp)\s+)?\w+\s+|\b(?:float|int|vec[234]|mat4)\s+)(\w+)/g;
let declared = new Set();
for (let glsl of shaders) {
    for (let [, name] of glsl.matchAll(DECLARATION)) {
        if (name.length >= 3 && name !== "main" && !name.startsWith("gl_")) {
            declared.add(name);
        }
    }
}

let taken = new Set();
for (let glsl of shaders) {
    for (let [word] of glsl.matchAll(/\b[A-Za-z_]\w*\b/g)) {
        taken.add(word);
    }
}
for (let reserved of ["if", "in", "do", "for", "out", "int"]) {
    taken.add(reserved);
}

let uses = (name) => shaders.join(" ").split(new RegExp(`\\b${name}\\b`)).length - 1;
let order = [...declared].sort((a, b) => uses(b) - uses(a));

let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
let next = 0;
function short_name() {
    for (;;) {
        let n = next++;
        let name = "";
        do {
            name = letters[n % letters.length] + name;
            n = Math.floor(n / letters.length) - 1;
        } while (n >= 0);
        if (!taken.has(name)) {
            return name;
        }
    }
}

let map = new Map(order.map((name) => [name, short_name()]));

// Leave the JavaScript expressions interpolated into a template alone.
let rename = (glsl) =>
    glsl.replace(/\$\{[^}]*\}|(?<![.\w])[A-Za-z_]\w*\b/g, (word) =>
        word.startsWith("${") ? word : map.get(word) || word,
    );

js = js.replace(/\0(\d+)\0/g, (all, index) => rename(shaders[index]));

let missing = [];
let lookups = 0;
js = js.replace(LOOKUP, (all, before, name, after) => {
    lookups++;
    if (!map.has(name) && !shaders.some((glsl) => new RegExp(`\\b${name}\\b`).test(glsl))) {
        missing.push(name);
    }
    return before + (map.get(name) || name) + after;
});

if (lookups === 0) {
    console.error("glsl.cjs: no uniform or attribute lookups found; did their shape change?");
    process.exit(1);
}

if (missing.length) {
    console.error("glsl.cjs: lookups of names no shader declares: " + missing.join(", "));
    process.exit(1);
}

process.stdout.write(js);
