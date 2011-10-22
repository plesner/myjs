LIB_FILES=src/utils.js src/ast.js src/tedir.js src/my.js src/mimetype.js
MISC_FILES=test/framework.js test/test.js
VERSION=0.1
LIB=myjs-$(VERSION).js

all:		test $(LIB)

presubmit:	test lint

$(LIB):		$(LIB_FILES) Makefile src/main.js
		node src/main.js compile $(LIB_FILES) > $(LIB)

test:
		node src/main.js test

lint:
		gjslint $(LIB_FILES) $(MISC_FILES)

clean:
		rm -f $(LIB)

.PHONY: 	test lint
