const inputImageTexture = new THREE.TextureLoader().load('input.png', 
    function onLoad(texture) {
        console.log('Image texture loaded successfully.');
        // FILEPATH: /Users/ryan/git/Neural-Network/js/scene.js
        // BEGIN: ed8c6549bwf9
        // Convert Image to Particles
        const particles = createParticlesFromImage(texture);
        // END: ed8c6549bwf9
    },
    function onError(error) {
        console.error('Error loading image texture:', error);
    }
);