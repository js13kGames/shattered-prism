EXAMPLE ?= src
SOURCES := $(shell find .. -type f -name "*.ts")

# The day-to-day build packs with fixed parameters, found by one -O2 search,
# so that two builds of the same code give the same size. The -O1 search is
# faster than the fixed set but not deterministic: it moves by about 30 bytes
# between runs. Rerun the search (RELEASE=1) after big changes to the code and
# paste the parameters it prints here.
ifeq ($(RELEASE),1)
	ROADROLLER_FLAGS = -O2
	ADVZIP_FLAGS = --shrink-insane --iter 10000
else
	ROADROLLER_FLAGS = -Zab7 -Zdy0 -Zlr930 -Zmc4 -Zpr14 -S0,1,2,3,7,13,21,42,57,82,229,387
	ADVZIP_FLAGS = --shrink-insane
endif

all: index.html

game.esbuild.js: $(SOURCES)
	npx tsc --noEmit
	npx esbuild ../$(EXAMPLE)/index.ts \
		--preserve-symlinks \
		--define:DEBUG=false \
		--target=es2022 \
		--bundle \
		--analyze \
	> $@

game.sed.js: game.esbuild.js sed.txt glsl.cjs
	sed  -f sed.txt  $< | node glsl.cjs > $@

game.terser.js: game.sed.js terser_compress.txt | node_modules
	npx --quiet terser $< \
		--ecma 2022 \
		--mangle toplevel \
		--mangle-props keep_quoted,regex=/^[A-Z]/ \
		--compress $(shell paste -sd, terser_compress.txt) \
	> $@

game.roadroller.js: game.terser.js | node_modules
	npx --quiet roadroller $(ROADROLLER_FLAGS) --dirty $< -o $@

index.html: game.html game.roadroller.js game.css debug.css posthtml.cjs | node_modules
	node posthtml.cjs $< > $@

# https://www.7-zip.org/download.html
# http://www.advancemame.it/download
# 	macOS with MacPorts: sudo port install 7zip advancecomp
index.zip: index.html
	7zz a -mx=9 -mfb=256 -mpass=15 $@ $^
	advzip --recompress $(ADVZIP_FLAGS) $@

.PHONY: clean
clean:
	rm -f *.js index.html index.zip

node_modules:
	npm install
