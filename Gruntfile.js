module.exports = function(grunt) {
  var localConfig;
  try {
    localConfig = require('env.config');
  } catch(e) {
    localConfig = {};
  }

  grunt.initConfig({

    karma: {
      unit: {
        configFile: 'karma.conf.js',
        background: true
      },
      // Add a new travis ci karma configuration
      // configs here override those in our existing karma.conf.js
      travis: {
          configFile: 'karma.conf.js',
          singleRun: true,
          browsers: ['PhantomJS']
      }
    },
    watch: {
      karma: {
        files: ['client/app/**/*.js', 'Spec/unit/**/*.js'],
        tasks: ['karma:unit:run']
      }
    },
    env: {
      test: {
        NODE_ENV: 'test'
      },
      prod: {
        NODE_ENV: 'production'
      },
      all: localConfig
    },
    });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-karma');
  grunt.registerTask('devmode', ['env:all', 'env:test', 'karma:unit', 'watch']); //development build, watch for changes
  grunt.registerTask('test', ['karma:travis']);  //test build
  // grunt.registerTask('serve', ['build', 'env:all','env:prod']); //production build

};

