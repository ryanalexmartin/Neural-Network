module.exports = function ( grunt ) {

	grunt.initConfig( {

		pkg: grunt.file.readJSON( 'package.json' ),

		browserify: {
			build: {
				files: {
					'js/build/deploy.js': [ 'js/build/app.js' ]
				}
			}
		},
		babel: {
			options: {
				sourceMap: true,
				presets: ['@babel/preset-env']
			},
			build: {
				files: [{
					expand: true,
					cwd: 'js/',
					src: ['*.js'],
					dest: 'js/build',
					ext: '.js'
				}]
			}
		},
		concat: {
			options: {
				// banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
				// footer: ''
			},
			build: {
				src: [ 'js/neuron.js', 'js/signal.js', 'js/particlePool.js', 'js/particle.js', 'js/axon.js', 'js/neuralNet.js',
						 'js/loaders.js', 'js/scene.js', 'js/main.js', 'js/gui.js', 'js/run.js', 'js/events.js', 'js/vectorAnimations.js' ],

				dest: 'js/build/app.js'
			},
			vendor: {
				src: [ 'js/vendor/underscore.js', 'js/vendor/jquery.min.js', 'js/vendor/Detector.js', 'js/vendor/dat.gui.min.js',
						 'js/vendor/stats.min.js', 'js/vendor/three.js', 'js/vendor/OrbitControls.js', 'js/vendor/OBJLoader.js', 'js/vendor/svg.js', 
						 'js/vendor/gsap.js', 'js/vendor/SVGRenderer.js', 'js/vendor/Projector.js' ],

				dest: 'js/vendor/vendor-merge.js'
			}
		},
		uglify: {
			options: {},
			build: {
				src: [ 'js/build/app.js' ],
				dest: 'js/build/app.min.js',
				sourceMap: true
			},
			vendor: {
				src: [ 'js/vendor/vendor-merge.js' ],
				dest: 'js/vendor/vendor-merge.min.js',
				sourceMap: false
			}
		},
		watch: {
			options: { // global opptions for all watchers
				livereload: true
			},
			js: {
				files: 'js/*.js',
				tasks: [ 'concat' ]
			},
			html: {
				files: '*.html'
			}
		},
		connect: {
			server: {
				options: {
					port: 9001,
					base: '.',
				}
			}
		}

	} );

	// Load the plugin that provides the tasks.
	grunt.loadNpmTasks( 'grunt-browserify' );
	grunt.loadNpmTasks( 'grunt-babel' ); // load grunt-babel task
	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-contrib-connect' );

	// tasks
	grunt.registerTask( 'default', [ 'babel', 'watch' ] ); // add babel task to your default task
	grunt.registerTask( 'serve', [ 'connect:server', 'watch' ] );
	grunt.registerTask( 'build', [ 'babel', 'concat:build', 'uglify:build' ] ); // add babel task to your build task
	grunt.registerTask( 'dev', [ 'babel', 'concat' ] ); // add babel task to your dev task
	grunt.registerTask( 'vendor', [ 'concat:vendor', 'uglify:vendor' ] );
};