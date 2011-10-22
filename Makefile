# Files that need to be part of the resulting library.
LIB_FILES=        \
src/utils.js      \
src/ast.js        \
src/tedir.js      \
src/my.js         \
src/mimetype.js

# Files that we should lint but that aren't part of the library.
MISC_FILES=       \
test/framework.js \
test/test.js

# Current version.
VERSION=0.1

# Output library file.
LIB=myjs-$(VERSION).js

# Where to get closure from?
CLOSURE_ROOT=http://closure-compiler.googlecode.com/files
CLOSURE_ZIP=compiler-latest.zip

# Builds the library and then tests it.
all:		$(LIB) test

# Runs the tests and lints all files.
presubmit:	test lint

$(LIB):		$(LIB_FILES) closure
		java -jar closure/compiler.jar $(LIB_FILES:%=--js=%) --js_output_file $(LIB)

# Runs the tests using closure.
test:		$(LIB)
		node src/main.js test

# Lints all files
lint:
		gjslint $(LIB_FILES) $(MISC_FILES)

# Download and unzip the closure compiler.
closure:
		curl -O $(CLOSURE_ROOT)/$(CLOSURE_ZIP)
		mkdir -p closure
		unzip -d closure $(CLOSURE_ZIP)
		rm $(CLOSURE_ZIP)

# Clears up everything
clean:
		rm -f $(LIB) closure

.PHONY: 	test lint clean
