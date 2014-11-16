module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['dist'],
    uglify: {
      options: {
        mangle: false
      },
      all: {
        files: {
          'dist/pink.min.js': [
            'libs/Pink/Plugin/Router/1/lib.js', 
            'libs/Pink/Plugin/Signals/1/lib.js',
            'libs/Pink/Data/Binding/1/lib.js',
            'libs/Pink/Data/Module/1/lib.js',
            'libs/Pink/Data/DragDrop/1/lib.js',
            'libs/Pink/Data/Tooltip/1/lib.js',
            'libs/Pink/Data/Kanban/1/lib.js',
            'libs/Pink/Data/AutoComplete/1/lib.js',
            'libs/Pink/Data/ModalWindow/AlertBox/1/lib.js',
            'libs/Pink/Data/ModalWindow/InfoBox/1/lib.js',
            'libs/Pink/Data/ModalWindow/1/lib.js',
            'libs/Pink/Data/Validation/1/lib.js',
            'libs/Pink/Data/Paginator/1/lib.js',
            'libs/Pink/Data/Grid/1/lib.js',
            'libs/Pink/Data/Tabs/1/lib.js',
            'libs/Pink/Data/Carousel/1/lib.js',
            'libs/Pink/Data/DatePicker/1/lib.js',
            'libs/Pink/Data/Toggle/1/lib.js',
            'libs/Pink/App/1/lib.js'
          ]
        }
      }
    },
    concat: {
        all: {
            files: {
              'dist/pink.debug.js': [
                'libs/Pink/Plugin/Router/1/lib.js', 
                'libs/Pink/Plugin/Signals/1/lib.js',
                'libs/Pink/Data/Binding/1/lib.js',
                'libs/Pink/Data/Module/1/lib.js',
                'libs/Pink/Data/DragDrop/1/lib.js',
                'libs/Pink/Data/Tooltip/1/lib.js',
                'libs/Pink/Data/Kanban/1/lib.js',
                'libs/Pink/Data/AutoComplete/1/lib.js',
                'libs/Pink/Data/ModalWindow/AlertBox/1/lib.js',
                'libs/Pink/Data/ModalWindow/InfoBox/1/lib.js',
                'libs/Pink/Data/ModalWindow/1/lib.js',
                'libs/Pink/Data/Validation/1/lib.js',
                'libs/Pink/Data/Paginator/1/lib.js',
                'libs/Pink/Data/Grid/1/lib.js',
                'libs/Pink/Data/Tabs/1/lib.js',
                'libs/Pink/Data/Carousel/1/lib.js',
                'libs/Pink/Data/DatePicker/1/lib.js',
                'libs/Pink/Data/Toggle/1/lib.js',
                'libs/Pink/App/1/lib.js'
              ]
            }
        }
    },
    copy: {
      all: {
        files: [
          {src: 'libs/Pink/**/*.html', dest: 'dist/'},
          {src: 'content/css/pink.css', dest: 'dist/'}
        ]
      }
    },
    pinktemplates: {
        all: {
            src: 'libs/Pink/**/*.html', 
            dest: 'dist/pink-tpl-bundle.js'
        }
    }
  });

  // Load the third party plugins
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  
  // Register Pink's template bundler task
  grunt.registerMultiTask('pinktemplates', 'Pink template bundler', function() {
      var registerTplScript = ['Ink.requireModules([\'Pink.Data.Module_1\'], function(ko) {'];

      this.files.forEach(function(filePair) {
          filePair.src.forEach(function(src) {
              var templateName = src.split('/').slice(1, -1).join('.').replace(/.[1-9]/g, '_$&').replace(/_./g, '_');
              var templateContent = JSON.stringify(grunt.file.read(src));
              
              registerTplScript.push('ko.bindingHandlers.module.templateCache[\''+templateName+'\'] = {text: function() {return '+templateContent+';}};');
          });
      });

      registerTplScript.push('});');
      grunt.file.write(this.data.dest, registerTplScript.join('\n'));
      grunt.log.writeln(['Templates bundled']);
  });

  // Default task(s).
  grunt.registerTask('default', ['clean', 'uglify', 'concat', 'copy', 'pinktemplates']);
};
