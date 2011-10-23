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

CLOSURE_DEPS=     \
goog/base.js

# Current version.
VERSION=0.1

# Output library file.
LIB=myjs-$(VERSION).js

# Builds the library and then tests it.
all:		$(LIB) test

# Runs the tests and lints all files.
presubmit:	test lint docs

$(LIB):		$(LIB_FILES) tools/compiler tools/library
		java -jar tools/compiler/compiler.jar              \
		  $(CLOSURE_DEPS:%=--js=tools/library/closure/%)   \
		  $(LIB_FILES:%=--js=%)                            \
		  --js_output_file $(LIB)


# Runs the tests using closure.
test:		$(LIB)
		node src/main.js test

# Lints all files
lint:
		gjslint $(LIB_FILES) $(MISC_FILES)

JSDOC_ROOT=tools/jsdoc/jsdoc_toolkit-2.4.0/jsdoc-toolkit/
docs:		$(LIB_FILES) tools/jsdoc
		java -jar $(JSDOC_ROOT)/jsrun.jar $(JSDOC_ROOT)/app/run.js \
		  -t=$(JSDOC_ROOT)/templates/jsdoc                         \
		  -d=doc                                                   \
		  $(LIB_FILES)

# Cleans up any files we've built.
clean:
		rm -rf $(LIB) doc

# Cleans up any file we've built and downloaded.
very-clean:	clean
		rm -rf tools

COMPILER_ZIP=http://closure-compiler.googlecode.com/files/compiler-latest.zip
# Download and unpack the closure compiler.
tools/compiler:
		curl -o compiler.zip $(COMPILER_ZIP)
		mkdir -p tools/compiler
		unzip -d tools/compiler compiler.zip
		rm compiler.zip

CLOSURE_LIBRARY=http://closure-library.googlecode.com/svn/trunk/
# Check out the closure library.
tools/library:
		svn checkout $(CLOSURE_LIBRARY) tools/library

JSDOC_ZIP=http://jsdoc-toolkit.googlecode.com/files/jsdoc_toolkit-2.4.0.zip
# Download and unpack the jsdoc generator
tools/jsdoc:
		curl -o jsdoc.zip $(JSDOC_ZIP)
		mkdir -p tools/jsdoc
		unzip -d tools/jsdoc jsdoc.zip
		rm jsdoc.zip

.PHONY: 	test lint clean docs
