FILES=utils.js ast.js tedir.js my.js mimetype.js
VERSION=0.1
LIB=myjs-$(VERSION).js

all:	test $(LIB)

$(LIB):	$(FILES) Makefile main.js
	node main.js compile $(FILES) > $(LIB)

test:
	node main.js test

.PHONY: test
