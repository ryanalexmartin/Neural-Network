// Neuron ----------------------------------------------------------------

function Neuron( x, y, z ) {

	this.connection = [];
	this.receivedSignal = false;
	this.lastSignalRelease = 0;
	this.releaseDelay = 0;
	this.fired = false;
	this.firedCount = 0;
	this.prevReleaseAxon = null;
	THREE.Vector3.call( this, x, y, z );

}

Neuron.prototype = Object.create( THREE.Vector3.prototype );

Neuron.prototype.connectNeuronTo = function ( neuronB ) {

	var neuronA = this;
	// create axon and establish connection
	var axon = new Axon( neuronA, neuronB );
	neuronA.connection.push( new Connection( axon, 'A' ) );
	neuronB.connection.push( new Connection( axon, 'B' ) );
	return axon;

};

Neuron.prototype.createSignal = function ( particlePool, minSpeed, maxSpeed ) {

	this.firedCount += 1;
	this.receivedSignal = false;

	var signals = [];
	// create signal to all connected axons
	for ( var i = 0; i < this.connection.length; i++ ) {
		if ( this.connection[ i ].axon !== this.prevReleaseAxon ) {
			var c = new Signal( particlePool, minSpeed, maxSpeed );
			c.setConnection( this.connection[ i ] );
			signals.push( c );
		}
	}
	return signals;

};

Neuron.prototype.reset = function () {

	this.receivedSignal = false;
	this.lastSignalRelease = 0;
	this.releaseDelay = 0;
	this.fired = false;
	this.firedCount = 0;

};

// Signal extends THREE.Vector3 ----------------------------------------------------------------

function Signal( particlePool, minSpeed, maxSpeed ) {

	this.minSpeed = minSpeed;
	this.maxSpeed = maxSpeed;
	this.speed = THREE.Math.randFloat( this.minSpeed, this.maxSpeed );
	this.alive = true;
	this.t = null;
	this.startingPoint = null;
	this.axon = null;
	this.particle = particlePool.getParticle();
	THREE.Vector3.call( this );

}

Signal.prototype = Object.create( THREE.Vector3.prototype );

Signal.prototype.setConnection = function ( Connection ) {

	this.startingPoint = Connection.startingPoint;
	this.axon = Connection.axon;
	if ( this.startingPoint === 'A' ) this.t = 0;
	else if ( this.startingPoint === 'B' ) this.t = 1;

};

Signal.prototype.travel = function ( deltaTime ) {

	var pos;
	if ( this.startingPoint === 'A' ) {
		this.t += this.speed * deltaTime;
		if ( this.t >= 1 ) {
			this.t = 1;
			this.alive = false;
			this.axon.neuronB.receivedSignal = true;
			this.axon.neuronB.prevReleaseAxon = this.axon;
		}

	} else if ( this.startingPoint === 'B' ) {
		this.t -= this.speed * deltaTime;
		if ( this.t <= 0 ) {
			this.t = 0;
			this.alive = false;
			this.axon.neuronA.receivedSignal = true;
			this.axon.neuronA.prevReleaseAxon = this.axon;
		}
	}

	pos = this.axon.getPoint( this.t );
	// pos = this.axon.getPointAt(this.t);	// uniform point distribution but slower calculation

	this.particle.set( pos.x, pos.y, pos.z );

};

// Particle Pool ---------------------------------------------------------

function ParticlePool( poolSize ) {

	this.spriteTextureSignal = TEXTURES.electric;

	this.poolSize = poolSize;
	this.pGeom = new THREE.Geometry();
	this.particles = this.pGeom.vertices;

	this.offScreenPos = new THREE.Vector3( 9999, 9999, 9999 );

	this.pColor = '#37edb8';
	this.pSize = 0.2;

	for ( var ii = 0; ii < this.poolSize; ii++ ) {
		this.particles[ ii ] = new Particle( this );
	}

	this.meshComponents = new THREE.Object3D();

	// inner particle
	this.pMat = new THREE.PointCloudMaterial( {
		map: this.spriteTextureSignal,
		size: this.pSize,
		color: this.pColor,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	} );

	this.pMesh = new THREE.PointCloud( this.pGeom, this.pMat );
	this.pMesh.frustumCulled = false;

	this.meshComponents.add( this.pMesh );


	// outer particle glow
	this.pMat_outer = this.pMat.clone();
	this.pMat_outer.size = this.pSize * 10;
	this.pMat_outer.opacity = 0.04;

	this.pMesh_outer = new THREE.PointCloud( this.pGeom, this.pMat_outer );
	this.pMesh_outer.frustumCulled = false;

	this.meshComponents.add( this.pMesh_outer );

}

ParticlePool.prototype.getAvgExecutionTime = function () {
	return this.profTime / this.itt;
};

ParticlePool.prototype.getParticle = function () {

	for ( var ii = 0; ii < this.poolSize; ii++ ) {
		var p = this.particles[ ii ];
		if ( p.available ) {
			this.lastAvailableIdx = ii;
			p.available = false;
			return p;
		}
	}

	console.error( "ParticlePool.prototype.getParticle return null" );
	return null;

};

ParticlePool.prototype.update = function () {

	this.pGeom.verticesNeedUpdate = true;

};

ParticlePool.prototype.updateSettings = function () {

	// inner particle
	this.pMat.color.setStyle( this.pColor );
	this.pMat.size = this.pSize;
	// outer particle
	this.pMat_outer.color.setStyle( this.pColor );
	this.pMat_outer.size = this.pSize * 10;

};

// Particle --------------------------------------------------------------
// Private class for particle pool

function Particle( particlePool ) {

	this.particlePool = particlePool;
	this.available = true;
	THREE.Vector3.call( this, this.particlePool.offScreenPos.x, this.particlePool.offScreenPos.y, this.particlePool.offScreenPos.z );

}

Particle.prototype = Object.create( THREE.Vector3.prototype );

Particle.prototype.free = function () {

	this.available = true;
	this.set( this.particlePool.offScreenPos.x, this.particlePool.offScreenPos.y, this.particlePool.offScreenPos.z );

};

// Axon extends THREE.CubicBezierCurve3 ------------------------------------------------------------------
/* exported Axon, Connection */

function Axon( neuronA, neuronB ) {

	this.bezierSubdivision = 8;
	this.neuronA = neuronA;
	this.neuronB = neuronB;
	this.cpLength = neuronA.distanceTo( neuronB ) / THREE.Math.randFloat( 1.5, 4.0 );
	this.controlPointA = this.getControlPoint( neuronA, neuronB );
	this.controlPointB = this.getControlPoint( neuronB, neuronA );
	THREE.CubicBezierCurve3.call( this, this.neuronA, this.controlPointA, this.controlPointB, this.neuronB );

	this.vertices = this.getSubdividedVertices();

}

Axon.prototype = Object.create( THREE.CubicBezierCurve3.prototype );

Axon.prototype.getSubdividedVertices = function () {
	return this.getSpacedPoints( this.bezierSubdivision );
};

// generate uniformly distribute vector within x-theta cone from arbitrary vector v1, v2
Axon.prototype.getControlPoint = function ( v1, v2 ) {

	var dirVec = new THREE.Vector3().copy( v2 ).sub( v1 ).normalize();
	var northPole = new THREE.Vector3( 0, 0, 1 ); // this is original axis where point get sampled
	var axis = new THREE.Vector3().crossVectors( northPole, dirVec ).normalize(); // get axis of rotation from original axis to dirVec
	var axisTheta = dirVec.angleTo( northPole ); // get angle
	var rotMat = new THREE.Matrix4().makeRotationAxis( axis, axisTheta ); // build rotation matrix

	var minz = Math.cos( THREE.Math.degToRad( 45 ) ); // cone spread in degrees
	var z = THREE.Math.randFloat( minz, 1 );
	var theta = THREE.Math.randFloat( 0, Math.PI * 2 );
	var r = Math.sqrt( 1 - z * z );
	var cpPos = new THREE.Vector3( r * Math.cos( theta ), r * Math.sin( theta ), z );
	cpPos.multiplyScalar( this.cpLength ); // length of cpPoint
	cpPos.applyMatrix4( rotMat ); // rotate to dirVec
	cpPos.add( v1 ); // translate to v1
	return cpPos;

};

// Connection ------------------------------------------------------------
function Connection( axon, startingPoint ) {
	this.axon = axon;
	this.startingPoint = startingPoint;
}

// Neural Network --------------------------------------------------------

function NeuralNetwork() {

	this.initialized = false;

	this.settings = {
		/*default
		verticesSkipStep       : 2,
		maxAxonDist            : 10,
		maxConnectionsPerNeuron: 6,
		signalMinSpeed         : 1.75,
		signalMaxSpeed         : 3.25,
		currentMaxSignals      : 3000,
		limitSignals           : 10000
		*/

		verticesSkipStep: 2,
		maxAxonDist: 12,
		maxConnectionsPerNeuron: 12,
		signalMinSpeed: 1.9,
		signalMaxSpeed: 3,
		currentMaxSignals: 1000,
		limitSignals: 10000

	};

	this.meshComponents = new THREE.Object3D();
	this.particlePool = new ParticlePool( this.settings.limitSignals );
	this.meshComponents.add( this.particlePool.meshComponents );

	// NN component containers
	this.components = {
		neurons: [],
		allSignals: [],
		allAxons: []
	};

	// axon
	this.axonOpacityMultiplier = 1.5;
	this.axonColor = '#13b6d9';
	this.axonGeom = new THREE.BufferGeometry();
	this.axonPositions = [];
	this.axonIndices = [];
	this.axonNextPositionsIndex = 0;

	this.axonUniforms = {
		color: {
			type: 'c',
			value: new THREE.Color( this.axonColor )
		},
		opacityMultiplier: {
			type: 'f',
			value: this.axonOpacityMultiplier
		}
	};

	this.axonAttributes = {
		opacity: {
			type: 'f',
			value: []
		}
	};

	// neuron
	this.neuronSizeMultiplier = 1;
	this.spriteTextureNeuron = TEXTURES.electric;
	this.neuronColor = '#28b1a0';
	this.neuronOpacity = 0.95;
	this.neuronsGeom = new THREE.Geometry();

	this.neuronUniforms = {
		sizeMultiplier: {
			type: 'f',
			value: this.neuronSizeMultiplier
		},
		opacity: {
			type: 'f',
			value: this.neuronOpacity
		},
		texture: {
			type: 't',
			value: this.spriteTextureNeuron
		}
	};

	this.neuronAttributes = {
		color: {
			type: 'c',
			value: []
		},
		size: {
			type: 'f',
			value: []
		}
	};

	this.neuronShaderMaterial = new THREE.ShaderMaterial( {

		uniforms: this.neuronUniforms,
		attributes: this.neuronAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: THREE.AdditiveBlending,
		transparent: true,
		depthTest: false

	} );

	// info api
	this.numNeurons = 0;
	this.numAxons = 0;
	this.numSignals = 0;

	this.numPassive = 0;

	// initialize NN
	this.initNeuralNetwork();

}

NeuralNetwork.prototype.initNeuralNetwork = function () {

	this.initNeurons( OBJ_MODELS.brain.geometry.vertices );
	this.initAxons();

	this.neuronShaderMaterial.vertexShader = SHADER_CONTAINER.neuronVert;
	this.neuronShaderMaterial.fragmentShader = SHADER_CONTAINER.neuronFrag;

	this.axonShaderMaterial.vertexShader = SHADER_CONTAINER.axonVert;
	this.axonShaderMaterial.fragmentShader = SHADER_CONTAINER.axonFrag;

	this.initialized = true;

};

NeuralNetwork.prototype.initNeurons = function ( inputVertices ) {

	var i;
	for ( i = 0; i < inputVertices.length; i += this.settings.verticesSkipStep ) {
		var pos = inputVertices[ i ];
		var n = new Neuron( pos.x, pos.y, pos.z );
		this.components.neurons.push( n );
		this.neuronsGeom.vertices.push( n );
		// dont set neuron's property here because its skip vertices
	}

	// set neuron attributes value
	for ( i = 0; i < this.components.neurons.length; i++ ) {
		this.neuronAttributes.color.value[ i ] = new THREE.Color( '#28b1a0' ); // initial neuron color
		this.neuronAttributes.size.value[ i ] = THREE.Math.randFloat( 0.75, 3.0 ); // initial neuron size
	}


	// neuron mesh
	this.neuronParticles = new THREE.PointCloud( this.neuronsGeom, this.neuronShaderMaterial );
	this.meshComponents.add( this.neuronParticles );

	this.neuronShaderMaterial.needsUpdate = true;

};

NeuralNetwork.prototype.initAxons = function () {

	var allNeuronsLength = this.components.neurons.length;
	for ( var j = 0; j < allNeuronsLength; j++ ) {
		var n1 = this.components.neurons[ j ];
		for ( var k = j + 1; k < allNeuronsLength; k++ ) {
			var n2 = this.components.neurons[ k ];
			// connect neuron if distance is within threshold and limit maximum connection per neuron
			if ( n1 !== n2 && n1.distanceTo( n2 ) < this.settings.maxAxonDist &&
				n1.connection.length < this.settings.maxConnectionsPerNeuron &&
				n2.connection.length < this.settings.maxConnectionsPerNeuron ) {
				var connectedAxon = n1.connectNeuronTo( n2 );
				this.constructAxonArrayBuffer( connectedAxon );
			}
		}
	}

	// enable WebGL 32 bit index buffer or get an error
	if ( !renderer.getContext().getExtension( "OES_element_index_uint" ) ) {
		console.error( "32bit index buffer not supported!" );
	}

	var axonIndices = new Uint32Array( this.axonIndices );
	var axonPositions = new Float32Array( this.axonPositions );
	var axonOpacities = new Float32Array( this.axonAttributes.opacity.value );

	this.axonGeom.addAttribute( 'index', new THREE.BufferAttribute( axonIndices, 1 ) );
	this.axonGeom.addAttribute( 'position', new THREE.BufferAttribute( axonPositions, 3 ) );
	this.axonGeom.addAttribute( 'opacity', new THREE.BufferAttribute( axonOpacities, 1 ) );
	this.axonGeom.computeBoundingSphere();

	this.axonShaderMaterial = new THREE.ShaderMaterial( {
		uniforms: this.axonUniforms,
		attributes: this.axonAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true
	} );

	this.axonMesh = new THREE.Line( this.axonGeom, this.axonShaderMaterial, THREE.LinePieces );
	this.meshComponents.add( this.axonMesh );


	var numNotConnected = 0;
	for ( i = 0; i < allNeuronsLength; i++ ) {
		if ( !this.components.neurons[ i ].connection[ 0 ] ) {
			numNotConnected += 1;
		}
	}
	console.log( 'numNotConnected =', numNotConnected );

};

NeuralNetwork.prototype.update = function ( deltaTime ) {

	if ( !this.initialized ) return;

	var n, ii;
	var currentTime = Date.now();

	// update neurons state and release signal
	for ( ii = 0; ii < this.components.neurons.length; ii++ ) {

		n = this.components.neurons[ ii ];

		if ( this.components.allSignals.length < this.settings.currentMaxSignals - this.settings.maxConnectionsPerNeuron ) { // limit total signals currentMaxSignals - maxConnectionsPerNeuron because allSignals can not bigger than particlePool size

			if ( n.receivedSignal && n.firedCount < 8 ) { // Traversal mode
				// if (n.receivedSignal && (currentTime - n.lastSignalRelease > n.releaseDelay) && n.firedCount < 8)  {	// Random mode
				// if (n.receivedSignal && !n.fired )  {	// Single propagation mode
				n.fired = true;
				n.lastSignalRelease = currentTime;
				n.releaseDelay = THREE.Math.randInt( 100, 1000 );
				this.releaseSignalAt( n );
			}

		}

		n.receivedSignal = false; // if neuron recieved signal but still in delay reset it
	}

	// reset all neurons and when there is no signal and trigger release signal at random neuron
	if ( this.components.allSignals.length === 0 ) {

		this.resetAllNeurons();
		this.releaseSignalAt( this.components.neurons[ THREE.Math.randInt( 0, this.components.neurons.length ) ] );

	}

	// update and remove dead signals
	for ( var j = this.components.allSignals.length - 1; j >= 0; j-- ) {
		var s = this.components.allSignals[ j ];
		s.travel( deltaTime );

		if ( !s.alive ) {
			s.particle.free();
			for ( var k = this.components.allSignals.length - 1; k >= 0; k-- ) {
				if ( s === this.components.allSignals[ k ] ) {
					this.components.allSignals.splice( k, 1 );
					break;
				}
			}
		}

	}

	// update particle pool vertices
	this.particlePool.update();

	// update info for GUI
	this.updateInfo();

};

NeuralNetwork.prototype.constructAxonArrayBuffer = function ( axon ) {
	this.components.allAxons.push( axon );
	var vertices = axon.vertices;

	for ( var i = 0; i < vertices.length; i++ ) {

		this.axonPositions.push( vertices[ i ].x, vertices[ i ].y, vertices[ i ].z );

		if ( i < vertices.length - 1 ) {
			var idx = this.axonNextPositionsIndex;
			this.axonIndices.push( idx, idx + 1 );

			var opacity = THREE.Math.randFloat( 0.005, 0.2 );
			this.axonAttributes.opacity.value.push( opacity, opacity );

		}

		this.axonNextPositionsIndex += 1;
	}
};

NeuralNetwork.prototype.releaseSignalAt = function ( neuron ) {
	var signals = neuron.createSignal( this.particlePool, this.settings.signalMinSpeed, this.settings.signalMaxSpeed );
	for ( var ii = 0; ii < signals.length; ii++ ) {
		var s = signals[ ii ];
		this.components.allSignals.push( s );
	}
};

NeuralNetwork.prototype.resetAllNeurons = function () {

	this.numPassive = 0;
	for ( var ii = 0; ii < this.components.neurons.length; ii++ ) { // reset all neuron state
		n = this.components.neurons[ ii ];

		if ( !n.fired ) {
			this.numPassive += 1;
		}

		n.reset();

	}
	// console.log( 'numPassive =', this.numPassive );

};

NeuralNetwork.prototype.updateInfo = function () {
	this.numNeurons = this.components.neurons.length;
	this.numAxons = this.components.allAxons.length;
	this.numSignals = this.components.allSignals.length;
};

NeuralNetwork.prototype.updateSettings = function () {

	this.neuronUniforms.opacity.value = this.neuronOpacity;

	for ( i = 0; i < this.components.neurons.length; i++ ) {
		this.neuronAttributes.color.value[ i ].setStyle( this.neuronColor ); // initial neuron color
	}
	this.neuronAttributes.color.needsUpdate = true;

	this.neuronUniforms.sizeMultiplier.value = this.neuronSizeMultiplier;

	this.axonUniforms.color.value.set( this.axonColor );
	this.axonUniforms.opacityMultiplier.value = this.axonOpacityMultiplier;

	this.particlePool.updateSettings();


};

NeuralNetwork.prototype.testChangOpcAttr = function () {

	var opcArr = this.axonGeom.attributes.opacity.array;
	for ( var i = 0; i < opcArr.length; i++ ) {
		opcArr[ i ] = THREE.Math.randFloat( 0, 0.5 );
	}
	this.axonGeom.attributes.opacity.needsUpdate = true;
};

// Assets & Loaders --------------------------------------------------------

var loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = function () {

	document.getElementById( 'loading' ).style.display = 'none'; // hide loading animation when finished
	console.log( 'Done.' );

	main();

};


loadingManager.onProgress = function ( item, loaded, total ) {

	console.log( loaded + '/' + total, item );

};


var shaderLoader = new THREE.XHRLoader( loadingManager );
shaderLoader.setResponseType( 'text' );

shaderLoader.loadMultiple = function ( SHADER_CONTAINER, urlObj ) {

	_.each( urlObj, function ( value, key ) {

		shaderLoader.load( value, function ( shader ) {

			SHADER_CONTAINER[ key ] = shader;

		} );

	} );

};

var SHADER_CONTAINER = {};
shaderLoader.loadMultiple( SHADER_CONTAINER, {

	neuronVert: 'shaders/neuron.vert',
	neuronFrag: 'shaders/neuron.frag',

	axonVert: 'shaders/axon.vert',
	axonFrag: 'shaders/axon.frag'

} );



var OBJ_MODELS = {};
var OBJloader = new THREE.OBJLoader( loadingManager );
OBJloader.load( 'models/brain_vertex_low.obj', function ( model ) {

	OBJ_MODELS.brain = model.children[ 0 ];

} );


var TEXTURES = {};
var textureLoader = new THREE.TextureLoader( loadingManager );

textureLoader.load( 'sprites/electric.png', function ( tex ) {

	TEXTURES.electric = tex;

} );

textureLoader.load('sprites/img_4721.png', function(tex) {
    TEXTURES.input_image_01 = tex;
});
// var GSAP = require('gsap');
// var SVG = require('svg.js');

// Scene --------------------------------------------------------
/* exported updateHelpers */

if (!Detector.webgl) {
	Detector.addGetWebGLMessage();
}

var container, stats;
var scene, light, camera, cameraCtrl, renderer;
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var pixelRatio = window.devicePixelRatio || 1;
var screenRatio = WIDTH / HEIGHT;
var clock = new THREE.Clock();
var FRAME_COUNT = 0;

// ---- Settings
var sceneSettings = {
	pause: false,
	bgColor: 0x010c14,
	enableGridHelper: false,
	enableAxisHelper: false
};

// ---- Scene
container = document.getElementById('canvas-container');
scene = new THREE.Scene();

// ---- Camera
camera = new THREE.PerspectiveCamera(75, screenRatio, 10, 5000);
// camera orbit control
cameraCtrl = new THREE.OrbitControls(camera, container);
cameraCtrl.object.position.y = 1;
cameraCtrl.enabled = false;
cameraCtrl.update();

// ---- Renderer
renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true
});
renderer.setSize(WIDTH, HEIGHT);
renderer.setPixelRatio(pixelRatio);
renderer.setClearColor(sceneSettings.bgColor, 1);
renderer.autoClear = false;
container.appendChild(renderer.domElement);

// ---- Resize once to match browser's initial size
camera.aspect = screenRatio;
camera.updateProjectionMatrix();
renderer.setSize(WIDTH, HEIGHT);
renderer.setPixelRatio(pixelRatio);

// ---- Stats
// stats = new Stats();
// container.appendChild( stats.domElement );

// ---- grid & axis helper
// var gridHelper = new THREE.GridHelper( 600, 50 );
// gridHelper.setColors( 0x00bbff, 0xffffff );
// gridHelper.material.opacity = 0.1;
// gridHelper.material.transparent = true;
// gridHelper.position.y = -300;
// scene.add( gridHelper );

// var axisHelper = new THREE.AxisHelper( 50 );
// scene.add( axisHelper );

// function updateHelpers() {
// 	axisHelper.visible = sceneSettings.enableAxisHelper;
// 	gridHelper.visible = sceneSettings.enableGridHelper;
// }

/*
// ---- Lights
// back light
light = new THREE.DirectionalLight( 0xffffff, 0.8 );
light.position.set( 100, 230, -100 );
scene.add( light );

// hemi
light = new THREE.HemisphereLight( 0x00ffff, 0x29295e, 1 );
light.position.set( 370, 200, 20 );
scene.add( light );

// ambient
light = new THREE.AmbientLight( 0x111111 );
scene.add( light );
*/



// vector animation (new)


function createParticlesFromImage(imageTexture) {
	// Create a canvas to draw the image
	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');

	// Draw the image onto the canvas
	canvas.width = imageTexture.image.width;
	canvas.height = imageTexture.image.height;
	context.drawImage(imageTexture.image, 0, 0, canvas.width, canvas.height);

	// Get the image data from the canvas
	var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
	var data = imageData.data;

	// Create the particle system geometry
	var geometry = new THREE.Geometry();

	// For each pixel in the image, create a vertex in the geometry
	for (var y = 0; y < canvas.height; y++) {
		for (var x = 0; x < canvas.width; x++) {
			// Get the color of the pixel
			var index = (y * canvas.width + x) * 4;
			var red = data[index];
			var green = data[index + 1];
			var blue = data[index + 2];

			// Create a new vertex for the particle system
			var vertex = new THREE.Vector3(x - canvas.width / 2, -y + canvas.height / 2, 0);

			// Set the color of the vertex based on the color of the pixel
			vertex.color = new THREE.Color('rgb(' + red + ',' + green + ',' + blue + ')');

			// Add the vertex to the geometry
			geometry.vertices.push(vertex);
		}
	}

	// Create the material for the particle system
	var material = new THREE.PointCloudMaterial({
		size: 1,
		vertexColors: THREE.VertexColors, // This allows us to use the colors we set for each vertex
		map: imageTexture, // This texture will be applied to each particle
		transparent: true
	});

	// Create the particle system and return it
	var particles = new THREE.PointCloud(geometry, material);
	return particles;
}

function convertSVGToThreeJS(svgString) {
	const objects = [];

	// Parse the SVG string into an SVG document
	const parser = new DOMParser();
	const svgDoc = parser.parseFromString(svgString, "image/svg+xml");

	// Loop through each child element of the SVG document
	svgDoc.childNodes.forEach(childNode => {
		// Create a new object for each child element
		const object = new THREE.Object3D();

		// Set the position of the object based on the child element's attributes
		object.position.x = parseFloat(childNode.getAttribute("x")) || 0;
		object.position.y = parseFloat(childNode.getAttribute("y")) || 0;
		object.position.z = parseFloat(childNode.getAttribute("z")) || 0;

		// Set the rotation of the object based on the child element's attributes
		object.rotation.x = parseFloat(childNode.getAttribute("rx")) || 0;
		object.rotation.y = parseFloat(childNode.getAttribute("ry")) || 0;
		object.rotation.z = parseFloat(childNode.getAttribute("rz")) || 0;

		// Set the scale of the object based on the child element's attributes
		object.scale.x = parseFloat(childNode.getAttribute("scale-x")) || 1;
		object.scale.y = parseFloat(childNode.getAttribute("scale-y")) || 1;
		object.scale.z = parseFloat(childNode.getAttribute("scale-z")) || 1;

		// Add the object to the array
		objects.push(object);
	});

	return objects;
}



// Assuming your Three.js scene, camera, and renderer are already set up, 
// you would have something like the following in your code:

// const scene = existing scene
// const camera = existing camera
// const renderer = existing renderer

const networkSVG = SVG.get('sprites/nn(2).svg');
var loader = new THREE.TextureLoader();

loader.load(
	// resource URL
	"sprites/img_4721.png",

	// onLoad callback
	function (texture) {
		// the texture is fully loaded at this point

		// Convert Image to Particles
		const particles = createParticlesFromImage(texture);

		scene.add(particles);

		// Convert SVG to Three.js objects
		const networkObjects = convertSVGToThreeJS(networkSVG);
		networkObjects.forEach(function (object) {
			scene.add(object);
		});

		// Position camera to view the whole scene
		camera.position.z = 5; // adjust this value to fit your specific scene

		// Create Animation Timeline
		const timeline = GSAP.timeline();

		timeline.to(particles.material.opacity, { value: 0, duration: 2 });
		timeline.call(animateParticlesThroughNetwork, [particles, networkSVG], "+=2");
		timeline.call(reformImageFromParticles, [particles], "+=2");

		// If your animation loop is already running, just add GSAP.tick(); to it
		function animate() {
			GSAP.tick();
			renderer.render(scene, camera);
			requestAnimationFrame(animate);
		}

		// assuming 'scene' is your THREE.Scene instance
		scene.add(particles);
	},

	// onProgress callback currently not supported
	undefined,

	// onError callback
	function () {
		console.error('An error occurred while loading the texture');
	}
);

// Main --------------------------------------------------------
/* exported main, updateGuiInfo */

var gui, gui_info, gui_settings;

function main() {

	var neuralNet = window.neuralNet = new NeuralNetwork();
	scene.add( neuralNet.meshComponents );

	// initGui();

	run();

}

// GUI --------------------------------------------------------
/* exported iniGui, updateGuiInfo */

function initGui() {

	gui = new dat.GUI();
	gui.width = 270;

	gui_info = gui.addFolder( 'Info' );
	gui_info.add( neuralNet, 'numNeurons' ).name( 'Neurons' );
	gui_info.add( neuralNet, 'numAxons' ).name( 'Axons' );
	gui_info.add( neuralNet, 'numSignals', 0, neuralNet.settings.limitSignals ).name( 'Signals' );
	gui_info.autoListen = false;

	gui_settings = gui.addFolder( 'Settings' );
	gui_settings.add( neuralNet.settings, 'currentMaxSignals', 0, neuralNet.settings.limitSignals ).name( 'Max Signals' );
	gui_settings.add( neuralNet.particlePool, 'pSize', 0.2, 2 ).name( 'Signal Size' );
	gui_settings.add( neuralNet.settings, 'signalMinSpeed', 0.0, 8.0, 0.01 ).name( 'Signal Min Speed' );
	gui_settings.add( neuralNet.settings, 'signalMaxSpeed', 0.0, 8.0, 0.01 ).name( 'Signal Max Speed' );
	gui_settings.add( neuralNet, 'neuronSizeMultiplier', 0, 2 ).name( 'Neuron Size Mult' );
	gui_settings.add( neuralNet, 'neuronOpacity', 0, 1.0 ).name( 'Neuron Opacity' );
	gui_settings.add( neuralNet, 'axonOpacityMultiplier', 0.0, 5.0 ).name( 'Axon Opacity Mult' );
	gui_settings.addColor( neuralNet.particlePool, 'pColor' ).name( 'Signal Color' );
	gui_settings.addColor( neuralNet, 'neuronColor' ).name( 'Neuron Color' );
	gui_settings.addColor( neuralNet, 'axonColor' ).name( 'Axon Color' );
	gui_settings.addColor( sceneSettings, 'bgColor' ).name( 'Background' );

	gui_info.open();
	gui_settings.open();

	for ( var i = 0; i < gui_settings.__controllers.length; i++ ) {
		gui_settings.__controllers[ i ].onChange( updateNeuralNetworkSettings );
	}

}

function updateNeuralNetworkSettings() {
	neuralNet.updateSettings();
	if ( neuralNet.settings.signalMinSpeed > neuralNet.settings.signalMaxSpeed ) {
		neuralNet.settings.signalMaxSpeed = neuralNet.settings.signalMinSpeed;
		gui_settings.__controllers[ 3 ].updateDisplay();
	}
}

function updateGuiInfo() {
	for ( var i = 0; i < gui_info.__controllers.length; i++ ) {
		gui_info.__controllers[ i ].updateDisplay();
	}
}

// Run --------------------------------------------------------

function update() {

	// updateHelpers();

	if ( !sceneSettings.pause ) {

		cameraCtrl.object.rotation.x -= 0.0003;

		var deltaTime = clock.getDelta();
		neuralNet.update( deltaTime );
		// updateGuiInfo();

	}

}

// ----  draw loop
function run() {

	requestAnimationFrame( run );
	renderer.setClearColor( sceneSettings.bgColor, 1 );
	renderer.clear();
	update();
	renderer.render( scene, camera );
	// stats.update();
	FRAME_COUNT ++;

}

// Events --------------------------------------------------------

window.addEventListener( 'keypress', function ( event ) {

	var key = event.keyCode;

	switch ( key ) {

		case 32:/*space bar*/ sceneSettings.pause = !sceneSettings.pause;
			break;

		case 65:/*A*/
		case 97:/*a*/ sceneSettings.enableGridHelper = !sceneSettings.enableGridHelper;
			break;

		case 83 :/*S*/
		case 115:/*s*/ sceneSettings.enableAxisHelper = !sceneSettings.enableAxisHelper;
			break;

	}

} );


$( function () {
	var timerID;
	$( window ).resize( function () {
		clearTimeout( timerID );
		timerID = setTimeout( function () {
			onWindowResize();
		}, 250 );
	} );
} );


function onWindowResize() {
	if (/Mobi|Android/i.test(navigator.userAgent)) {
		// do nothing if on mobile platform
		return;
	}

	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;

	pixelRatio = window.devicePixelRatio || 1;
	screenRatio = WIDTH / HEIGHT;

	camera.aspect = screenRatio;
	camera.updateProjectionMatrix();

	renderer.setSize( WIDTH, HEIGHT );
	renderer.setPixelRatio( pixelRatio );

}

// Carousel controls
function Sliders(o) {
	"use strict";
	var time = o.time || 500,
		autoTime = o.autoTime || 5000,
		selector = o.selector,
		width_height = o.width_height || 100 / 70,
		sliders = document.querySelectorAll(selector),
		i;
	function css(elm, prop, val) {
	  elm.style[prop] = val;
	  prop = prop[0].toUpperCase() + prop.slice(1);
	  elm.style["webkit" + prop] = elm.style["moz" + prop] =
		elm.style["ms" + prop] = elm.style["o" + prop] = val;
	}
	function anonimFunc(slider) {
	  var buttonLeft = slider.children[2],
		  buttonRight = slider.children[1],
		  ul = slider.children[0],
		  li = ul.children,
		  activeIndex = 0,
		  isAnimate = false,
		  i,
		  s;
	  ul.style.paddingTop = (100 / width_height) + "%";
	  for (i = 0; i < li.length; i += 1) {
		css(li[i], "animationDuration", time + "ms");
	  }
	  li[activeIndex].classList.add("active");
	  function left() {
		if (isAnimate) {return; }
		clearTimeout(s);
		isAnimate = true;
		var nextIndex = (activeIndex < li.length - 1) ? (activeIndex + 1) : (0);
		li[nextIndex].classList.add("next");
		li[activeIndex].classList.add("left");
		li[nextIndex].classList.add("active");
		setTimeout(function () {
		  li[activeIndex].classList.remove("active");
		  li[activeIndex].classList.remove("left");
		  li[nextIndex].classList.remove("next");
		  li[nextIndex].classList.add("active");
		  activeIndex = nextIndex;
		  isAnimate = false;
		  s = setTimeout(left, autoTime);
		}, time);
	  }
	  function right() {
		if (isAnimate) {return; }
		clearTimeout(s);
		isAnimate = true;
		var nextIndex = (activeIndex > 0) ? (activeIndex - 1) : (li.length - 1);
		li[nextIndex].classList.add("previous");
		li[activeIndex].classList.add("right");
		li[nextIndex].classList.add("active");
		setTimeout(function () {
		  li[activeIndex].classList.remove("active");
		  li[activeIndex].classList.remove("right");
		  li[nextIndex].classList.remove("previous");
		  li[nextIndex].classList.add("active");
		  activeIndex = nextIndex;
		  isAnimate = false;
		  s = setTimeout(right, autoTime);
		}, time);
	  }
	  buttonLeft.addEventListener("click", left);
	  buttonRight.addEventListener("click", right);
	  s = setTimeout(right, autoTime);
	}
	for (i = 0; i < sliders.length; i += 1) {
	  anonimFunc(sliders[i]);
	}
  }
  
  
  /* -- how to use it ? -- */
  var sliders = new Sliders({
	selector: ".slider",
	time: 500,
	autoTime: 3000,
	width_height: 350 / 250
  });