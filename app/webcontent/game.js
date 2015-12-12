var constants = {
	max_camera_size: 25.0,
	camera_offset: new THREE.Vector3(),
	color_table: [
		0x555555,
		0xff0000,
		0xff4400,
		0xff6600,
		0xff8800,
		0xffaa00,
		0xffbb00,
		0xaa9900,
		0x99aa00,
		0x77aa00,
		0x55aa00,
		0x33aa00,
		0x11aa00,
		0x00bb00,
		0x009900,
		0x008800,
		0x008822,
		0x008844,
		0x00aa66,
		0x00aa88,
		0x00aaaa,
		0x00aacc,
		0x00aadd,
		0x0088dd,
		0x0066dd,
		0x0044dd,
		0x0022dd,
		0x0000dd,
		0x0044ff,
		0x0022ff,
		0x0000ff,
		0x2200ff,
		0x4400ff,
		0x6600ff,
		0x8800ff,
		0xaa00ff,
		0xcc00ff,
		0xee00ff,
		0xff00ee,
		0xff00cc,
		0xff00aa,
		0xff0088,
		0xff0066,
		0xff0044,
		0xff0022,
	],
	level: {
		ids: [
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
		],

		numbers: [
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 9, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 9, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 9, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 9, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 9, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ],
		],
	},
};

var state = {
	numbers: [],
	ids: [],
};

var graphics = {
	clock: new THREE.Clock(),
	texture_loader: new THREE.TextureLoader(),
	scene: null,
	camera: null,
	renderer: null,
	material: null,
	mesh: null,
	ground: null,
	camera_size: 1.0,
	camera_size_target: 0,
	camera_pos: new THREE.Vector2(),
	camera_pos_target: new THREE.Vector2(),
};

var funcs = {};

funcs.color_hash = function(id) {
	return constants.color_table[id % constants.color_table.length];
};

funcs.init = function() {
	graphics.clock.start();

	graphics.scene = new THREE.Scene();

	graphics.camera = new THREE.OrthographicCamera
	(
		-1,
		1,
		1,
		-1,
		0.01, 1000
	);
	graphics.camera.rotation.x = Math.PI * 0.2;
	graphics.camera.rotation.y = Math.PI * 0.1;
	constants.camera_offset = graphics.camera.getWorldDirection().multiplyScalar(-constants.max_camera_size)

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
		dirLight.position.set(1, 0.5, 1.75);
		dirLight.position.multiplyScalar(50);
		graphics.scene.add(dirLight);

		dirLight.castShadow = true;

		dirLight.shadowMapWidth = 2048;
		dirLight.shadowMapHeight = 2048;

		var d = constants.max_camera_size * 1.5 * 0.5;

		dirLight.shadowCameraLeft = -d;
		dirLight.shadowCameraRight = d;
		dirLight.shadowCameraTop = d;
		dirLight.shadowCameraBottom = -d;

		dirLight.shadowCameraFar = constants.max_camera_size * 5.0;
		dirLight.shadowBias = -0.001;
	}

	graphics.mesh = funcs.add_mesh(new THREE.BoxGeometry(1, 1, 1), 0xff0000);
	graphics.mesh.position.z = 0.5;

	graphics.ground = funcs.add_mesh(new THREE.PlaneBufferGeometry(1, 1), 0xffddcc);

	graphics.renderer = new THREE.WebGLRenderer({ antialias: true });
	graphics.renderer.setSize(window.innerWidth, window.innerHeight);

	graphics.renderer.gammaInput = true;
	graphics.renderer.gammaOutput = true;

	graphics.renderer.shadowMap.enabled = true;
	graphics.renderer.shadowMap.cullFace = THREE.CullFaceBack;
	graphics.renderer.shadowMap.type = THREE.PCFShadowMap;
	graphics.renderer.setClearColor(0xddeeff);
	graphics.renderer.setPixelRatio(window.devicePixelRatio);

	document.body.appendChild(graphics.renderer.domElement);

	funcs.load_level(0, constants.level);
	funcs.on_resize();

	$(window).on('resize', funcs.on_resize);

	$(document).on('keydown', funcs.on_keydown);

	funcs.animate();
}

funcs.on_keydown = function(event) {
	if (event.altKey)
		return;

	switch (event.keyCode) {
		case 87: //W
		case 38: //up
			graphics.mesh.position.y += 1;
			break;
		case 83: //S
		case 40: //down
			graphics.mesh.position.y -= 1;
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
	// TODO: error handling
};

funcs.width = function() {
	return state.numbers[0].length;
};

funcs.height = function() {
	return state.numbers.length;
};

funcs.load_level = function(id, level) {
	state = level;

	var texture = graphics.texture_loader.load
	(
		'test.png',
		function(texture) {
			texture.minFilter = texture.magFilter = THREE.NearestFilter;
			texture.needsUpdate = true;
		},
		funcs.error
	);

	graphics.ground.material.map = texture;
	graphics.ground.scale.set(funcs.width(), funcs.height(), 1);
	graphics.ground.position.set(funcs.width() * 0.5 - 0.5, funcs.height() * 0.5 - 0.5, 0);

	for (var x = 0; x < funcs.width(); x++)
	{
		for (var y = 0; y < funcs.height(); y++)
		{
			var number = state.numbers[x][y];
			if (number > 0)
			{
				var cell_height = number * 0.1;
				var mesh = funcs.add_mesh(new THREE.BoxGeometry(1, 1, cell_height), funcs.color_hash(state.ids[x][y]));
				mesh.position.set(x, y, cell_height * 0.5);
			}
		}
	}

	funcs.update_camera_target();
	graphics.camera_pos.copy(graphics.camera_pos_target);
	graphics.camera_size = graphics.camera_size_target;
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
	var dt = graphics.clock.getDelta();

	requestAnimationFrame(funcs.animate);

	graphics.renderer.render(graphics.scene, graphics.camera);

	graphics.camera_pos.lerp(graphics.camera_pos_target, dt * 10.0);

	graphics.camera_size = graphics.camera_size < graphics.camera_size_target
		? Math.min(graphics.camera_size_target, graphics.camera_size + dt)
		: Math.max(graphics.camera_size_target, graphics.camera_size - dt);

	graphics.camera.position.set(graphics.camera_pos.x, graphics.camera_pos.y, 0).add(constants.camera_offset);
	funcs.update_projection();
}

funcs.on_resize = function() {
	funcs.update_projection();
	graphics.renderer.setSize(window.innerWidth, window.innerHeight);
}

funcs.update_projection = function() {
	var min_size = window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight;
	var zoom = graphics.camera_size / min_size;
	graphics.camera.left = -0.5 * window.innerWidth * zoom;
	graphics.camera.right = 0.5 * window.innerWidth * zoom;
	graphics.camera.top = 0.5 * window.innerHeight * zoom;
	graphics.camera.bottom = -0.5 * window.innerHeight * zoom;
	graphics.camera.updateProjectionMatrix();
};

funcs.update_camera_target = function() {
	var min = new THREE.Vector2(funcs.width(), funcs.height());
	var max = new THREE.Vector2(0, 0);
	var average = new THREE.Vector2();
	var count = 0;
	for (var x = 0; x < funcs.width(); x++)
	{
		for (var y = 0; y < funcs.height(); y++)
		{
			if (state.ids[x][y] === 1 && state.numbers[x][y] > 0)
			{
				min.x = Math.min(min.x, x);
				min.y = Math.min(min.y, y);
				max.x = Math.max(max.x, x);
				max.y = Math.max(max.y, y);
				average.x += x;
				average.y += y;
				count++;
			}
		}
	}
	average.multiplyScalar(1.0 / count);
	graphics.camera_pos_target.copy(average);
	var size = Math.max(max.x - min.x, max.y - min.y);
	graphics.camera_size_target = Math.min(size + 3, constants.max_camera_size);
};

$(document).ready(funcs.init);
