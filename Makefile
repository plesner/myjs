FILES=src/utils.js src/ast.js src/tedir.js src/my.js src/mimetype.js
VERSION=0.1
LIB=myjs-$(VERSION).js

all:	test $(LIB)

$(LIB):	$(FILES) Makefile src/main.js
	node src/main.js compile $(FILES) > $(LIB)

test:
	node src/main.js test

.PHONY: test
