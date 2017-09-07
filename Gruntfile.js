
module.exports = function runGrunt(grunt) {
  'use strict';

  var ALL_FILES = [ 'Gruntfile.js', 'lib/**/*.js', 'spec/**/*.js' ],
      JSHINT_OPTIONS = {
        curly: true,
        eqeqeq: true,
        esversion: 6,
        forin: true,
        immed: true,
        latedef: true,
        noarg: true,
        node: true,
        strict: true,
        undef: true,
        unused: 'vars',

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
    jasmine_nodejs: {
      options: {
        reporters: {
          console: {
            colors: true
          }
        }
      },
      all: {
        specs: [ 'spec/**/*.js' ]
      }
    },
    jshint: {
      files: ALL_FILES,
      options: JSHINT_OPTIONS
    },
    watch: {
      files: ALL_FILES,
      tasks: ['jshint', 'jasmine_nodejs']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jasmine-nodejs');
  grunt.loadNpmTasks('grunt-contrib-watch');
};
