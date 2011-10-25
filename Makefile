# Files that need to be part of the resulting library.
SHARED_FILES=     \
src/utils.js      \
src/ast.js        \
src/tedir.js      \
src/my.js

NODE_LIB_FILES=   \
$(SHARED_FILES)   \
src/node-module.js

WEB_LIB_FILES=    \
$(SHARED_FILES)   \
src/mimetype.js

# Files that we should lint but that aren't part of the library.
MISC_FILES=       \
test/framework.js \
test/test.js

CLOSURE_DEPS=     \
goog/base.js

# Current version.
VERSION=0.1

# Output library files.
WEB_LIB=myjs-$(VERSION).js
NODE_LIB=myjs-$(VERSION)-node.js

# Builds the library and then tests it.
all:		$(WEB_LIB) test

# Runs the tests and lints all files.
presubmit:	test lint docs

$(WEB_LIB):	$(WEB_LIB_FILES) tools/compiler tools/library
		java -jar tools/compiler/compiler.jar              \
		  $(CLOSURE_DEPS:%=--js=tools/library/closure/%)   \
		  $(WEB_LIB_FILES:%=--js=%)                        \
		  --js_output_file $(WEB_LIB)

$(NODE_LIB):	$(NODE_LIB_FILES) tools/compiler tools/library
		java -jar tools/compiler/compiler.jar              \
		  $(CLOSURE_DEPS:%=--js=tools/library/closure/%)   \
		  $(NODE_LIB_FILES:%=--js=%)                       \
		  --js_output_file $(NODE_LIB)

# Runs the tests using closure.
test:		$(NODE_LIB_FILES)
		node src/main.js test

# Lints all files
lint:
		gjslint $(SHARED_FILES) $(MISC_FILES)

JSDOC_ROOT=tools/jsdoc/jsdoc_toolkit-2.4.0/jsdoc-toolkit/
JSDOC_FLAGS=-t=$(JSDOC_ROOT)/templates/jsdoc
docs:		$(SHARED_FILES) tools/jsdoc
		java -jar $(JSDOC_ROOT)/jsrun.jar $(JSDOC_ROOT)/app/run.js \
		  $(JSDOC_FLAGS)                                           \
		  -d=doc                                                   \
		  $(SHARED_FILES)

private-docs:	$(SHARED_FILES) tools/jsdoc
		java -jar $(JSDOC_ROOT)/jsrun.jar $(JSDOC_ROOT)/app/run.js \
		  $(JSDOC_FLAGS)                                           \
		  -p -a							   \
		  -d=private-doc                                           \
		  $(SHARED_FILES)

# Cleans up any files we've built.
clean:
		rm -rf $(WEB_LIB) $(NODE_LIB) doc private-doc

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
