/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    meta: {
      version: '0.0.8',
      source: 'toml.js',
      sourceMin: 'toml.min.js',
      banner: '// TOML parser implementation, v<%= meta.version %>\n' +
        '// Copyright (c)<%= grunt.template.today("yyyy") %> alexander.beletsky@gmail.com\n' +
        '// Distributed under MIT license\n' +
        '// http://github.com/alexander.beletsky/toml.js\n'
    },

    mocha: {
      test: {
        src: ['test/index.html'],
        options: {
          run: true
        }
      }
    },

    rig: {
      standard: {
        src: ['src/<%= meta.source %>'],
        dest: 'lib/<%= meta.source %>'
      },
      amd: {
        src: ['src/amd.js'],
        dest: 'lib/amd/<%= meta.source %>'
      }
    },

    concat: {
      options: {
        stripBanners: true,
        banner: '<%= meta.banner %>'
      },
      standard: {
        src: ['<%= meta.banner %>', '<%= rig.standard.dest %>'],
        dest: '<%= rig.standard.dest %>'
      },
      amd: {
        src: ['<%= meta.banner %>', '<%= rig.amd.dest %>'],
        dest: '<%= rig.amd.dest %>'
      }
    },

    uglify: {
      standard: {
        files: {
          'lib/<%= meta.sourceMin %>': ['<%= concat.standard.dest %>']
        }
      },
      amd: {
        files: {
          'lib/amd/<%= meta.sourceMin %>': ['<%= concat.amd.dest %>']
        }
      }
    },

    jshint: {
      options: {
        "asi" : false,
        "bitwise" : true,
        "boss" : false,
        "curly" : true,
        "debug": false,
        "devel": false,
        "eqeqeq": true,
        "evil": true,
        "expr": true,
        "forin": false,
        "immed": true,
        "latedef" : false,
        "laxbreak": false,
        "multistr": true,
        "newcap": true,
        "noarg": true,
        "node" : true,
        "noempty": false,
        "nonew": true,
        "onevar": false,
        "plusplus": false,
        "regexp": false,
        "strict": false,
        "sub": false,
        "trailing" : true,
        "undef": true,
        globals: {
          jQuery: true,
          Backbone: true,
          _: true,
          Marionette: true,
          $: true,
          slice: true
        }
      },
      js: ['src/<%= meta.source %>']
    }
  });

  // Laoded tasks
  grunt.loadNpmTasks('grunt-rigger');
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task.
  grunt.registerTask('default', ['jshint', 'rig', 'concat', 'uglify']);
  grunt.registerTask('test', ['mocha']);
};
