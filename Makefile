
all:
	node --max-old-space-size=4096 src/main.js Pony ./docs/stdlib.ponylang.org/

clean:
	rm -rf ./Pony.docset
