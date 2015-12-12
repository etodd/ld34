var constants = {
	max_viewsize: 50.0,
};

var graphics = {
	texture_loader: new THREE.TextureLoader(),
	viewsize: 1.0,
	scene: null,
	camera: null,
	renderer: null,
	material: null,
	grid: null,
	mesh: null,
	world: {
		ground: null,
	},
};

var funcs = {};

funcs.init = function() {

	window.addEventListener('resize', funcs.on_resize, false);

	graphics.scene = new THREE.Scene();

	graphics.camera = new THREE.OrthographicCamera
	(
		-1,
		1,
		1,
		-1,
		0.01, 1000
	);
	graphics.camera.rotation.x = Math.PI * -0.3;
	graphics.camera.rotation.y = Math.PI * 0.1;

	{
		var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
		hemiLight.color.setHSL(0.6, 1, 0.6);
		hemiLight.groundColor.setHSL(0.095, 1, 0.75);
		hemiLight.position.set(0, 500, 0);
		graphics.scene.add(hemiLight);
	}

	{
		var dirLight = new THREE.DirectionalLight(0xffffff, 1);
		dirLight.color.setHSL(0.1, 1, 0.95);
		dirLight.position.set(0, 1.75, -1);
		dirLight.position.multiplyScalar(50);
		graphics.scene.add(dirLight);

		dirLight.castShadow = true;

		dirLight.shadowMapWidth = 2048;
		dirLight.shadowMapHeight = 2048;

		var d = constants.max_viewsize * 1.5 * 0.5;

		dirLight.shadowCameraLeft = -d;
		dirLight.shadowCameraRight = d;
		dirLight.shadowCameraTop = d;
		dirLight.shadowCameraBottom = -d;

		dirLight.shadowCameraFar = 3500;
		dirLight.shadowBias = -0.0001;
	}

	graphics.mesh = funcs.add_mesh(new THREE.BoxGeometry(1, 1, 1), 0xff0000);
	graphics.mesh.position.set(0.5, 0.5, 0.5);

	{
		graphics.world.ground = funcs.add_mesh(new THREE.PlaneBufferGeometry(64, 64), 0xffddcc);
		graphics.world.ground.rotation.x = -0.5 * Math.PI;
	}

	graphics.renderer = new THREE.WebGLRenderer({ antialias: true });
	graphics.renderer.setSize(window.innerWidth, window.innerHeight);

	graphics.renderer.gammaInput = true;
	graphics.renderer.gammaOutput = true;

	graphics.renderer.shadowMap.enabled = true;
	graphics.renderer.shadowMap.cullFace = THREE.CullFaceBack;
	graphics.renderer.shadowMap.type = THREE.PCFShadowMap;
	graphics.renderer.autoClear = false;
	graphics.renderer.setPixelRatio(window.devicePixelRatio);

	document.body.appendChild(graphics.renderer.domElement);

	funcs.load_level('test');
	funcs.move_camera(new THREE.Vector2(0, 0), 50.0);
	funcs.on_resize();

	$(document).on('keydown', funcs.on_keydown);

	funcs.animate();
}

funcs.on_keydown = function(event) {
	if (event.altKey)
		return;

	switch (event.keyCode) {
		case 87: //W
		case 38: //up
			graphics.mesh.position.z -= 1;
			break;
		case 83: //S
		case 40: //down
			graphics.mesh.position.z += 1;
			break;
		case 65: //A
		case 37: //left
			graphics.mesh.position.x -= 1;
			break;
		case 68: //D
		case 39: //right
			graphics.mesh.position.x += 1;
			break;
	}
};

funcs.error = function() {
};

funcs.load_level = function(name) {
	var texture = graphics.texture_loader.load
	(
		name + '.png',
		function(texture) {
			texture.minFilter = texture.magFilter = THREE.NearestFilter;
			texture.needsUpdate = true;
		},
		funcs.error
	);

	graphics.world.ground.material.map = texture;
};

funcs.add_mesh = function(geometry, color) {
	var material = new THREE.MeshPhongMaterial({ color: color, specular: 0x000000 });
	var mesh = new THREE.Mesh(geometry, material);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	graphics.scene.add(mesh);
	return mesh;
};

funcs.animate = function() {

	requestAnimationFrame(funcs.animate);

	graphics.renderer.render(graphics.scene, graphics.camera);
}

funcs.on_resize = function() {
	funcs.update_projection();
	graphics.renderer.setSize(window.innerWidth, window.innerHeight);
}

funcs.update_projection = function() {
	var min_size = window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight;
	var zoom = graphics.viewsize / min_size;
	graphics.camera.left = -0.5 * window.innerWidth * zoom;
	graphics.camera.right = 0.5 * window.innerWidth * zoom;
	graphics.camera.top = 0.5 * window.innerHeight * zoom;
	graphics.camera.bottom = -0.5 * window.innerHeight * zoom;
	graphics.camera.updateProjectionMatrix();
};

funcs.move_camera = function(pos, viewsize) {
	graphics.viewsize = viewsize < constants.max_viewsize ? viewsize : constants.max_viewsize;
	graphics.camera.position.set(pos.x, 0, pos.y).add(graphics.camera.getWorldDirection().multiplyScalar(-graphics.viewsize));
	funcs.update_projection();
};

$(document).ready(funcs.init);
