// Squeeze the whitespace out of the GLSL strings in the bundle.
//
// Shaders stay readable in the source. GLSL needs a line break only after a
// preprocessor directive, and #version is the only one the game uses, so the
// rest of each shader can be one line with no spaces around punctuation.
const fs = require("fs");

let js = fs.readFileSync(0, "utf8");
let count = 0;

js = js.replace(/(["`])#version 300 es(?:\\n|\n)((?:[^"`\\]|\\.)*?)\1/g, (all, quote, body) => {
    count++;
    let glsl = body
        .replace(/\\n|\n/g, " ")
        .replace(/\/\/[^]*?(?= {2}|$)/g, "")
        .replace(/\s+/g, " ")
        .replace(/ ?([\[\]{}();,=+\-*/<>!&|?:.]) ?/g, "$1")
        .trim();
    return quote + "#version 300 es\\n" + glsl + quote;
});

if (count === 0) {
    console.error("glsl.cjs: no shaders found");
    process.exit(1);
}
process.stdout.write(js);
