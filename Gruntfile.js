'use strict';

module.exports = function runGrunt(grunt) {

  const ALL_FILES = [ 'Gruntfile.js', 'lib/**/*.js', 'spec/**/*.js' ];

  grunt.initConfig({
    exec: {
      jasmine: {
        cmd: 'npx jasmine'
      },
      jsdoc: {
        cmd: 'npx jsdoc lib README.md -r -d doc -c jsdoc.conf.json -t node_modules/docdash'
      },
      eslint: {
        cmd: 'npx eslint lib spec'
      }
    },
    watch: {
      files: ALL_FILES,
      tasks: [ 'eslint', 'jasmine' ]
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('eslint', [ 'exec:eslint' ]);
  grunt.registerTask('jsdoc', [ 'exec:jsdoc' ]);
  grunt.registerTask('jasmine', [ 'exec:jasmine' ]);
};
