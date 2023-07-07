// // Assuming your Three.js scene, camera, and renderer are already set up, 
// // you would have something like the following in your code:

// // const scene = existing scene
// // const camera = existing camera
// // const renderer = existing renderer

// const networkSVG = SVG.get('sprites/nn(2).svg');
// const inputImageTexture = new THREE.TextureLoader().load('input.png');

// // Convert Image to Particles
// const particles = createParticlesFromImage(inputImageTexture);

// scene.add(particles);

// // Convert SVG to Three.js objects
// const networkObjects = convertSVGToThreeJS(networkSVG);
// networkObjects.forEach(object => scene.add(object));

// // Position camera to view the whole scene
// camera.position.z = 5; // adjust this value to fit your specific scene

// // Create Animation Timeline
// const timeline = GSAP.timeline();

// timeline.to(particles.material.opacity, { value: 0, duration: 2 });
// timeline.call(animateParticlesThroughNetwork, [particles, networkSVG], "+=2");
// timeline.call(reformImageFromParticles, [particles], "+=2");

// // If your animation loop is already running, just add GSAP.tick(); to it
// function animate() {
//   GSAP.tick();
//   renderer.render(scene, camera);
//   requestAnimationFrame(animate);
// }
"use strict";
//# sourceMappingURL=vectorAnimation.js.map
