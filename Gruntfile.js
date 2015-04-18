/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    eslint: {
      target: ['*.js', 'demo/*.js'],
      options: {
        config: '.eslintrc'
      }
    },
    jscs: {
        src: ['*.js', 'demo/*.js'],
        options: {
            config: '.jscsrc'
        }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-jscs');

  // Default task.
  grunt.registerTask('default', ['eslint', 'jscs']);
};
