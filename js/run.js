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
