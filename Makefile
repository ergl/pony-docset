
all: dep
	node --max-old-space-size=6048 src/main.js Pony ./docs/stdlib.ponylang.org/

dep:
	npm install

clean:
	rm -rf ./Pony.docset
