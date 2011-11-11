# Use this flag to get a debug version of the output library.
DEBUG=0

# Files that need to be part of the resulting library.
SHARED_FILES=                \
src/utils.js                 \
src/ast.js                   \
src/tedir.js                 \
src/myjs.js                  \
src/fragments/control.js     \
src/fragments/core.js        \
src/fragments/declaration.js \
src/fragments/exceptions.js  \
src/fragments/expression.js  \
src/fragments/iteration.js   \
src/fragments/lefthand.js    \
src/fragments/operators.js   \
src/fragments/program.js     \
src/fragments/statement.js   \
src/fragments/with.js        \
src/extensions/quote.js      \
src/extensions/harmony-classes.js

EXTRA_DEPS=Makefile

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
VERSION=0.2

OUTDIR=out

# Output library files.
WEB_LIB=$(OUTDIR)/myjs-web.js
NODE_LIB=$(OUTDIR)/myjs-node.js

ifeq ($(DEBUG), 0)
COMPILATION_LEVEL=ADVANCED_OPTIMIZATIONS
else
COMPILATION_LEVEL=WHITESPACE_ONLY
endif

# Extra closure flags.
CLOSURE_FLAGS=                               \
  --compilation_level=$(COMPILATION_LEVEL)   \
  --warning_level=VERBOSE                    \
  --language_in=ECMASCRIPT5		     \
  --externs src/externs.js                   \
  --output_wrapper="(function() { %output% })();"

# Patch to the command-line tool.
TOOL=tools/main.js

# Builds the library, tests it, benchmarks it, lints it.
all:		$(WEB_LIB) test bench lint

# Runs the tests and lints all files.
presubmit:	all

$(WEB_LIB):	$(WEB_LIB_FILES) download/compiler download/library $(OUTDIR) $(EXTRA_DEPS)
		java -jar download/compiler/compiler.jar              \
		  $(CLOSURE_DEPS:%=--js=download/library/closure/%)   \
		  $(WEB_LIB_FILES:%=--js=%)                           \
		  $(CLOSURE_FLAGS)                                    \
		  --js_output_file $(WEB_LIB)

$(NODE_LIB):	$(NODE_LIB_FILES) download/compiler download/library $(OUTDIR) $(EXTRA_DEPS)
		java -jar download/compiler/compiler.jar              \
		  $(CLOSURE_DEPS:%=--js=download/library/closure/%)   \
		  $(NODE_LIB_FILES:%=--js=%)                          \
		  $(CLOSURE_FLAGS)                                    \
		  --js_output_file $(NODE_LIB)

arch:		$(WEB_LIB) $(NODE_LIB) test bench
		cp $(WEB_LIB) archive/myjs-web-$(VERSION).js
		cp $(NODE_LIB) archive/myjs-node-$(VERSION).js

# Runs the tests using closure.
test:		$(NODE_LIB)
		$(TOOL) test

# Runs the benchmarks.
bench:		$(NODE_LIB) download/library
		$(TOOL) bench

# Lints all files
lint:
		gjslint $(SHARED_FILES) $(MISC_FILES)

JSDOC_ROOT=download/jsdoc/jsdoc_toolkit-2.4.0/jsdoc-toolkit/
JSDOC_FLAGS=-t=$(JSDOC_ROOT)/templates/jsdoc
docs:		$(SHARED_FILES) download/jsdoc $(OUTDIR) $(EXTRA_DEPS)
		java -jar $(JSDOC_ROOT)/jsrun.jar $(JSDOC_ROOT)/app/run.js \
		  $(JSDOC_FLAGS)                                           \
		  -d=$(OUTDIR)/doc                                         \
		  $(SHARED_FILES)

private-docs:	$(SHARED_FILES) download/jsdoc $(OUTDIR) $(EXTRA_DEPS)
		java -jar $(JSDOC_ROOT)/jsrun.jar $(JSDOC_ROOT)/app/run.js \
		  $(JSDOC_FLAGS)                                           \
		  -p -a							   \
		  -d=$(OUTDIR)/private-doc                                 \
		  $(SHARED_FILES)

# Cleans up any files we've built.
clean:
		rm -rf $(OUTDIR)

# Cleans up any file we've built and downloaded.
very-clean:	clean
		rm -rf download

COMPILER_ZIP=http://closure-compiler.googlecode.com/files/compiler-latest.zip
# Download and unpack the closure compiler.
download/compiler:
		curl -o compiler.zip $(COMPILER_ZIP)
		mkdir -p download/compiler
		unzip -d download/compiler compiler.zip
		rm compiler.zip

CLOSURE_LIBRARY=http://closure-library.googlecode.com/svn/trunk/
# Check out the closure library.
download/library:
		svn checkout $(CLOSURE_LIBRARY) download/library

$(OUTDIR):
		mkdir -p $(OUTDIR)

JSDOC_ZIP=http://jsdoc-toolkit.googlecode.com/files/jsdoc_toolkit-2.4.0.zip
# Download and unpack the jsdoc generator
download/jsdoc:
		curl -o jsdoc.zip $(JSDOC_ZIP)
		mkdir -p download/jsdoc
		unzip -d download/jsdoc jsdoc.zip
		rm jsdoc.zip

.PHONY: 	test lint clean docs bench all arch
