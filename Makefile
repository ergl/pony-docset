
all: dep
	node --max-old-space-size=4096 src/main.js Pony ./docs/stdlib.ponylang.org/

dep:
	npm install

clean:
	rm -rf ./Pony.docset
