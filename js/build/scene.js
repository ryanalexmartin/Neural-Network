"use strict";

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
    vertexColors: THREE.VertexColors,
    // This allows us to use the colors we set for each vertex
    map: imageTexture,
    // This texture will be applied to each particle
    transparent: true
  });

  // Create the particle system and return it
  var particles = new THREE.PointCloud(geometry, material);
  return particles;
}
function convertSVGToThreeJS(svgString) {
  var objects = [];

  // Parse the SVG string into an SVG document
  var parser = new DOMParser();
  var svgDoc = parser.parseFromString(svgString, "image/svg+xml");

  // Loop through each child element of the SVG document
  svgDoc.childNodes.forEach(function (childNode) {
    // Create a new object for each child element
    var object = new THREE.Object3D();

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

var networkSVG = SVG.get('sprites/nn(2).svg');
var loader = new THREE.TextureLoader();
loader.load(
// resource URL
"sprites/img_4721.png",
// onLoad callback
function (texture) {
  // the texture is fully loaded at this point

  // Convert Image to Particles
  var particles = createParticlesFromImage(texture);
  scene.add(particles);

  // Convert SVG to Three.js objects
  var networkObjects = convertSVGToThreeJS(networkSVG);
  networkObjects.forEach(function (object) {
    scene.add(object);
  });

  // Position camera to view the whole scene
  camera.position.z = 5; // adjust this value to fit your specific scene

  // Create Animation Timeline
  var timeline = GSAP.timeline();
  timeline.to(particles.material.opacity, {
    value: 0,
    duration: 2
  });
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
});
//# sourceMappingURL=scene.js.map
