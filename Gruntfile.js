
module.exports = function runGrunt(grunt) {
  'use strict';

  var ALL_FILES = [ 'Gruntfile.js', 'lib/**/*.js', 'spec/**/*.js' ],
      JSHINT_OPTIONS = {
        curly: true,
        eqeqeq: true,
        forin: true,
        immed: true,
        latedef: true,
        noarg: true,
        node: true,
        strict: true,
        undef: true,
        unused: true,

        globals: {
          afterEach: false,
          beforeEach: false,
          describe: false,
          expect: false,
          it: false,
          jasmine: false,
          runs: false,
          waitsFor: false,
          xdescribe: false,
          xit: false
        }
      };

  grunt.initConfig({
    jasmine_node: {
      options: {
        forceExit: false,
        jUnit: {
          report: false,
          savePath: './build/reports/jasmine',
          useDotNotation: true,
          consolidate: true
        }
      },
      all: ['spec/']
    },
    jshint: {
      files: ALL_FILES,
      options: JSHINT_OPTIONS
    },
    watch: {
      files: ALL_FILES,
      tasks: ['jshint', 'jasmine_node']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.loadNpmTasks('grunt-contrib-watch');
};
