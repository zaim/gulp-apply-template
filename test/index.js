/* global describe, it */

var gutil = require('gulp-util');
var es = require('event-stream');
var expect = require('expect.js');
var plugin = require('../');

var NAME = new RegExp('^' + require('../package.json').name);


function createFile (path, mode) {
  var contents = {
    stream: es.readArray(['fake contents']),
    buffer: new Buffer('fake contents')
  };

  var file = new gutil.File({
    path: 'test/fixtures/' + path,
    base: 'test/fixtures',
    cwd: 'test/',
    contents: contents[mode]
  });

  file.data = {
    custom : 'value'
  };

  return file;
}


function testFileContents (file, expected, mode, done) {
  if (mode === 'stream') {
    expect(file.isStream()).ok();
    file.contents.pipe(es.wait(function (err, data) {
      expect(data).eql(expected);
      done();
    }));
  } else {
    expect(file.isBuffer()).ok();
    expect(file.contents.toString()).eql(expected);
    done();
  }
}


function str () {
  return Array.prototype.join.call(arguments, '\n') + '\n';
}


function ticker (total, done) {
  return function () {
    if (--total === 0) {
      done();
    }
  };
}


function testSuit (mode) {

  var isBuffer = { stream:'false', buffer:'true'}[mode];

  var isStream = { stream:'true', buffer:'false'}[mode];

  var contentStub = 'fake contents';


  return function () {

    it('should set default file props in template context', function (done) {
      var expected = str(
        'path = "test/fixtures/default-props.txt"',
        'data = "[object Object]"',
        'data.custom = "value"',
        'contents = "' + contentStub + '"',
        'base = ""',
        'cwd = ""',
        'other = ""',
        'assigned = ""',
        'props = ""',
        'file = "[object Object]"',
        'file.path = "test/fixtures/default-props.txt"',
        'file.isBuffer = "' + isBuffer + '"',
        'file.isStream = "' + isStream + '"'
      );

      var file = createFile('default-props.txt', mode);

      var stream = plugin({
        engine: 'swig',
        template: 'test/fixtures/template.tpl'
      });

      stream.write(file);

      stream.once('data', function (file) {
        testFileContents(file, expected, mode, done);
      });
    });


    it('should set custom file props in template context', function (done) {
      var expected = str(
        'path = "test/fixtures/custom-props.txt"',
        'data = "[object Object]"',
        'data.custom = "value"',
        'contents = "' + contentStub + '"',
        'base = "test/fixtures"',
        'cwd = "test/"',
        'other = ""',
        'assigned = ""',
        'props = ""',
        'file = "[object Object]"',
        'file.path = "test/fixtures/custom-props.txt"',
        'file.isBuffer = "' + isBuffer + '"',
        'file.isStream = "' + isStream + '"'
      );

      var file = createFile('custom-props.txt', mode);

      var stream = plugin({
        engine: 'swig',
        template: 'test/fixtures/template.tpl',
        props : ['path', 'contents', 'data', 'base', 'cwd']
      });

      stream.write(file);

      stream.once('data', function (file) {
        testFileContents(file, expected, mode, done);
      });
    });


    it('should set user provided template context', function (done) {
      var expected = str(
        'path = "test/fixtures/custom-context.txt"',
        'data = "[object Object]"',
        'data.custom = "value"',
        'contents = "' + contentStub + '"',
        'base = ""',
        'cwd = ""',
        'other = "user"',
        'assigned = "values"',
        'props = "yes"',
        'file = "[object Object]"',
        'file.path = "test/fixtures/custom-context.txt"',
        'file.isBuffer = "' + isBuffer + '"',
        'file.isStream = "' + isStream + '"'
      );

      var file = createFile('custom-context.txt', mode);

      var stream = plugin({
        engine: 'swig',
        template: 'test/fixtures/template.tpl',
        context: {
          other: 'user',
          assigned: 'values',
          props: 'yes'
        }
      });

      stream.write(file);

      stream.once('data', function (file) {
        testFileContents(file, expected, mode, done);
      });
    });


    it('should have user provided context override defaults', function (done) {
      var expected = str(
        'path = "test/fixtures/custom-context-override.txt"',
        'data = "[object Object]"',
        'data.custom = "different value"',
        'contents = "different contents"',
        'base = "different/value"',
        'cwd = ""',
        'other = ""',
        'assigned = ""',
        'props = ""',
        'file = "[object Object]"',
        'file.path = "test/fixtures/custom-context-override.txt"',
        'file.isBuffer = "' + isBuffer + '"',
        'file.isStream = "' + isStream + '"'
      );

      var file = createFile('custom-context-override.txt', mode);

      var stream = plugin({
        engine: 'swig',
        template: 'test/fixtures/template.tpl',
        context: {
          base: 'different/value',
          contents : 'different contents',
          data: {
            custom: 'different value'
          }
        }
      });

      stream.write(file);

      stream.once('data', function (file) {
        testFileContents(file, expected, mode, done);
      });
    });


    it('should always have raw file object in context', function (done) {
      var expected = str(
        'path = "test/fixtures/raw-file-object.txt"',
        'data = "[object Object]"',
        'data.custom = "value"',
        'contents = "' + contentStub + '"',
        'base = ""',
        'cwd = ""',
        'other = ""',
        'assigned = ""',
        'props = ""',
        'file = "[object Object]"',
        'file.path = "test/fixtures/raw-file-object.txt"',
        'file.isBuffer = "' + isBuffer + '"',
        'file.isStream = "' + isStream + '"'
      );

      var file = createFile('raw-file-object.txt', mode);

      var stream = plugin({
        engine: 'swig',
        template: 'test/fixtures/template.tpl',
        context: {
          file : {
            path : 'should/not/be/overriden'
          }
        }
      });

      stream.write(file);

      stream.once('data', function (file) {
        testFileContents(file, expected, mode, done);
      });
    });


    it('should use dynamic context function', function (done) {
      var expected = str(
        'path = "test/fixtures/dynamic-context.txt"',
        'data = "[object Object]"',
        'data.custom = "value"',
        'contents = "' + contentStub + '"',
        'base = ""',
        'cwd = ""',
        'other = "dynamic"',
        'assigned = "context"',
        'props = "function"',
        'file = "[object Object]"',
        'file.path = "test/fixtures/dynamic-context.txt"',
        'file.isBuffer = "' + isBuffer + '"',
        'file.isStream = "' + isStream + '"'
      );

      var tick = ticker(2, done);

      var file = createFile('dynamic-context.txt', mode);

      var stream = plugin({
        engine: 'swig',
        template: 'test/fixtures/template.tpl',
        context: function (f) {
          expect(f).to.be(file);
          tick();
          return {
            other: 'dynamic',
            assigned: 'context',
            props: 'function'
          };
        }
      });

      stream.write(file);

      stream.once('data', function (file) {
        testFileContents(file, expected, mode, tick);
      });
    });


    it('should use dynamic engine function', function (done) {
      var expected = str(
        'path = "test/fixtures/dynamic-engine.txt"',
        'data = "[object Object]"',
        'data.custom = "value"',
        'contents = "' + contentStub + '"',
        'base = ""',
        'cwd = ""',
        'other = "context"',
        'assigned = "values"',
        'props = "yes"',
        'file = "[object Object]"',
        'file.path = "test/fixtures/dynamic-engine.txt"',
        'file.isBuffer = "' + isBuffer + '"',
        'file.isStream = "' + isStream + '"'
      );

      var tick = ticker(2, done);

      var file = createFile('dynamic-engine.txt', mode);

      var context = {
        other : 'context',
        assigned : 'values',
        props : 'yes'
      };

      var stream = plugin({
        engine: function (ctx, file) {
          expect(ctx.other).eql(context.other);
          expect(ctx.assigned).eql(context.assigned);
          expect(ctx.props).eql(context.props);
          tick();
          return 'swig';
        },
        template: 'test/fixtures/template.tpl',
        context: context
      });

      stream.write(file);

      stream.once('data', function (file) {
        testFileContents(file, expected, mode, tick);
      });
    });


    it('should use dynamic template function', function (done) {
      var expected = str(
        'path = "test/fixtures/dynamic-template.txt"',
        'data = "[object Object]"',
        'data.custom = "value"',
        'contents = "' + contentStub + '"',
        'base = ""',
        'cwd = ""',
        'other = "context"',
        'assigned = "values"',
        'props = "yes"',
        'file = "[object Object]"',
        'file.path = "test/fixtures/dynamic-template.txt"',
        'file.isBuffer = "' + isBuffer + '"',
        'file.isStream = "' + isStream + '"'
      );

      var tick = ticker(2, done);

      var file = createFile('dynamic-template.txt', mode);

      var context = {
        other : 'context',
        assigned : 'values',
        props : 'yes'
      };

      var stream = plugin({
        engine: 'swig',
        template: function (ctx, file) {
          expect(ctx.other).eql(context.other);
          expect(ctx.assigned).eql(context.assigned);
          expect(ctx.props).eql(context.props);
          tick();
          return 'test/fixtures/template.tpl';
        },
        context: context
      });

      stream.write(file);

      stream.once('data', function (file) {
        testFileContents(file, expected, mode, tick);
      });
    });

  };

}


describe('gulp-apply-template', function () {

  describe('on initialization', function () {
    it('should throw error on missing engine option', function () {
      expect(plugin).throwError(function (e) {
        expect(e).a(gutil.PluginError);
        expect(e.message).match(NAME);
      });
    });

    it('should throw error on missing template option', function () {
      expect(plugin.bind(null, { engine: 'swig' })).throwError(function (e) {
        expect(e).a(gutil.PluginError);
        expect(e.message).match(NAME);
      });
    });
  });

  describe('in buffer mode', testSuit('buffer'));
  describe('in stream mode', testSuit('stream'));
});

