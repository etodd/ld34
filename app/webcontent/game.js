// state

var constants = {
	ws_url: null,
	max_camera_size: 25.0,
	camera_offset: new THREE.Vector3(),
	respawn_delay: 3.0,
	cloud_margin: 7.0,
	cloud_speed: 0.5,
	other_player_colors: [
		0xff0000,
		0xcc7700,
		0xdd2200,
		0xcc7700,
		0xaa5500,
		0xee6600,
		0xff2200,
		0xaa1100,
		0xcc0000,
	],
	scenery_filenames: [
		null,
		['StairsV2.js'],
		[
			'BuildingV1.js',
			'BuildingV2.js',
			'BuildingV3.js',
			'BuildingV4.js',
			'BuildingV5.js',
			'BuildingV6.js',
			'BuildingV7.js',
			'BuildingV8.js',
			'BuildingV9.js',
		],
		['FencePostV1.js', 'FenceWallV1.js'],
		['RockV3.js'],
		['TreeV4.js', 'TreeV5.js'],
		['CylinderV2.js'],
	],
	directions: {
		down: 0,
		left: 1,
		up: 2,
		right: 3,
	},
};

var state = {
	values: [],
	ids: [],
	size: new THREE.Vector2(),
	player: null,
	respawn_timer: 0,
	is_alive: false,
};

var graphics = {
	animations: [],
	clouds: [],
	scenery: [],
	exit_geometry: null,
	exit_texture: null,
	texture_loader: new THREE.TextureLoader(),
	model_loader: new THREE.JSONLoader(),
	scene: null,
	camera: null,
	renderer: null,
	material: null,
	meshes: [],
	ground: null,
	camera_size: 1.0,
	camera_size_target: 0,
	camera_pos: new THREE.Vector2(),
	camera_pos_target: new THREE.Vector2(),
	sunlight: null,
};

var global = {
	swipe_start: new THREE.Vector2(),
	swipe_pos: new THREE.Vector2(),
	clock: new THREE.Clock(),
	request: null,
	ws: null,
	key_up: false,
	key_down: false,
	key_left: false,
	key_right: false,
};

// procedures

var funcs = {};

funcs.ajax = function(options)
{
	var r = new XMLHttpRequest();
	r.withCredentials = true;

	if (options.dataType)
		r.responseType = options.dataType;

	r.open(options.type || 'GET', options.url + '?' + new Date().getTime(), true);

	r.options = options;

	r.onload = function()
	{
		if (!options.background)
			global.request = null;
		if (this.status >= 200 && this.status < 400)
		{
			if (options.success)
			{
				if (options.dataType === 'json' && typeof this.response === 'string')
					options.success(JSON.parse(this.response));
				else
					options.success(this.response);
			}
		}
		else if (options.error)
			options.error(r);
	};

	r.onerror = function()
	{
		if (!options.background)
			global.request = null;
		if (options.error)
			options.error(r);
	};

	if (!options.background)
		global.request = r;

	r.send(options.data);

	return r;
};

funcs.ajax_abort = function()
{
	if (global.request !== null)
	{
		global.request.abort();
		if (global.request.options.error)
			global.request.options.error(global.request);
		global.request = null;
	}
};

funcs.ws_on_close = function()
{
	setTimeout(function()
	{
		if (global.ws !== null && global.ws.readyState !== 1)
			funcs.ws_connect();
	}, 2000);
};

funcs.ws_send = function(packet) {
	if (global.ws !== null && global.ws.readyState === 1)
		global.ws.send(JSON.stringify(packet));
	else
		funcs.error('WebSocket send error');
};

funcs.ws_on_message = function(msg)
{
	if (msg.type === 'initState') {
		state.player = msg.player;
		funcs.load_level(msg.level);
	}
	else if (msg.type === 'stateUpdate') {
		for (var i = 0; i < msg.events.length; i++) {
			var event = msg.events[i];
			if (event.value === 0) {
				// Kill whatever's there
				state.values[event.cellId] = event.value;
				state.ids[event.cellId] = event.playerId;

				var mesh = graphics.meshes[event.cellId];
				if (mesh)
					graphics.scene.remove(mesh);
				graphics.meshes[event.cellId] = null;
			}
			else {
				if (event.dir !== -1) {
					// move the mesh
					state.values[event.cellId] = 0;
					state.ids[event.cellId] = 0;

					var nextCellId;
					switch (event.dir) {
						case 0: // down
							nextCellId = event.cellId - state.size.x;
							break;
						case 1: // left
							nextCellId = event.cellId - 1;
							break;
						case 2: // up
							nextCellId = event.cellId + state.size.x;
							break;
						case 3: // right
							nextCellId = event.cellId + 1;
							break;
					}

					state.values[nextCellId] = event.value;
					state.ids[nextCellId] = event.playerId;

					for (var j = 0; j < graphics.animations.length; j++) {
						if (graphics.animations[j].new_cell === event.cellId) {
							funcs.complete_animation(graphics.animations[j]);
							graphics.animations.splice(j, 1);
							j--;
						}
					}

					var mesh = graphics.meshes[event.cellId];
					var remove_mesh = graphics.meshes[nextCellId];
					graphics.meshes[event.cellId] = null;
					graphics.meshes[nextCellId] = mesh;

					graphics.animations.push({
						mesh: mesh,
						remove_mesh: remove_mesh,
						new_cell: nextCellId,
						pos: funcs.xy(event.cellId),
						new_pos: funcs.xy(nextCellId),
						blend: 0,
						value: event.value,
						id: event.playerId,
					});
				}
				else
				{
					state.values[event.cellId] = event.value;
					state.ids[event.cellId] = event.playerId;

					// Just update the mesh
					funcs.set_mesh(event.cellId, event.value, event.playerId);
				}
			}
		}
		funcs.update_camera_target();
	}
};

funcs.ws_connect = function()
{
	global.ws = new WebSocket(constants.ws_url);
	global.ws.onopen = function(e){

	}
	global.ws.onmessage = function(msg)
	{
		funcs.ws_on_message(JSON.parse(msg.data));
	};
	global.ws.onclose = funcs.ws_on_close;
};

funcs.color_hash = function(id) {
	if (id === 0)
		return 0x888888;
	else if (id === 1)
		return 0x111111;
	else if (state.player !== null && id === state.player.id)
		return 0x002266;

	return constants.other_player_colors[id % constants.other_player_colors.length];
};

funcs.init = function() {
	graphics.model_loader.load('3DModels/exit.js', function(geometry, materials) {
		graphics.exit_geometry = geometry;
		graphics.exit_texture = graphics.texture_loader.load
		(
			'3DModels/exit.png',
			funcs.done_loading,
			funcs.error
		);
	});
};

funcs.done_loading = function() {

	var filenames = [
		'CloudV1.js',
		'CloudV2.js',
		'CloudV3.js',
		'CloudV4.js',
		'CloudV5.js',
		'CloudV6.js',
		'Cloud7.js',
		'Cloud8.js',
		'CloudV9.js',
	];

	for (var i = 0; i < filenames.length; i++) {
		var filename = filenames[i];

		graphics.model_loader.load('3DModels/' + filename, function(geometry, materials) {
			for (var j = 0; j < 2; j++) {
				var cloud = funcs.add_mesh(geometry, 0xffffff, materials);
				cloud.position.x = -constants.cloud_margin + Math.random() * 30.0;
				cloud.position.y = -constants.cloud_margin + Math.random() * 30.0;
				cloud.position.z = -6.0 + Math.random() * 3.0;
				graphics.clouds.push(cloud);
			}
		});
	}

	global.clock.start();

	window.addEventListener('resize', funcs.on_resize, false);

	graphics.scene = new THREE.Scene();

	graphics.camera = new THREE.OrthographicCamera
	(
		-1,
		1,
		1,
		-1,
		0.1, constants.max_camera_size * 4
	);
	graphics.camera.rotation.x = Math.PI * 0.2;
	graphics.camera.rotation.y = Math.PI * 0.08;
	graphics.camera.rotation.z = Math.PI * 0.08;
	constants.camera_offset = graphics.camera.getWorldDirection().multiplyScalar(-constants.max_camera_size * 2.0);

	{
		var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
		hemiLight.color.setHSL(0.6, 1, 0.6);
		hemiLight.groundColor.setHSL(0.095, 1, 0.75);
		hemiLight.position.set(0, 500, 0);
		graphics.scene.add(hemiLight);
	}

	{
		graphics.sunlight = new THREE.DirectionalLight(0xffffff, 1);
		graphics.sunlight.color.setHSL(0.1, 1, 0.95);
		graphics.sunlight.position.set(1, 0.5, 1.75);
		graphics.sunlight.position.multiplyScalar(50);
		graphics.scene.add(graphics.sunlight);

		graphics.sunlight.castShadow = true;

		graphics.sunlight.shadow.mapSize.width = 2048;
		graphics.sunlight.shadow.mapSize.height = 2048;

		graphics.sunlight.shadow.camera.far = constants.max_camera_size * 5.0;
		graphics.sunlight.shadow.bias = -0.001;
	}

	graphics.ground = funcs.add_mesh(new THREE.PlaneBufferGeometry(1, 1), 0xffddcc);

	graphics.renderer = new THREE.WebGLRenderer({ antialias: true });
	graphics.renderer.setSize(window.innerWidth, window.innerHeight);

	graphics.renderer.gammaInput = true;
	graphics.renderer.gammaOutput = true;

	graphics.renderer.shadowMap.enabled = true;
	graphics.renderer.shadowMap.cullFace = THREE.CullFaceBack;
	graphics.renderer.shadowMap.type = THREE.PCFShadowMap;
	graphics.renderer.setClearColor(0xccddff);
	graphics.renderer.setPixelRatio(window.devicePixelRatio);

	document.body.appendChild(graphics.renderer.domElement);

	funcs.on_resize();

	$(window).on('resize', funcs.on_resize);

	$(document).on('keydown', funcs.on_keydown);
	$(document).on('keyup', funcs.on_keyup);

	$(document).on('mousedown', funcs.on_mousedown);
	$(document).on('mousemove', funcs.on_mousemove);
	$(document).on('mouseup', funcs.on_mouseup);
	$(document).on('touchstart', funcs.on_mousedown);
	$(document).on('touchmove', funcs.on_mousemove);
	$(document).on('touchend', funcs.on_mouseup);

	funcs.ws_connect();

	funcs.update_camera_target();

	graphics.camera_pos.copy(graphics.camera_pos_target);
	graphics.camera_size = graphics.camera_size_target;

	funcs.animate();
};

funcs.on_keyup = function(event) {
	switch (event.keyCode) {
		case 87: //W
		case 38: //up
			global.key_up = false;
			event.preventDefault();
			break;
		case 83: //S
		case 40: //down
			global.key_down = false;
			event.preventDefault();
			break;
		case 65: //A
		case 37: //left
			global.key_left = false;
			event.preventDefault();
			break;
		case 68: //D
		case 39: //right
			global.key_right = false;
			event.preventDefault();
			break;
		case 32://space
			event.preventDefault();
			funcs.ws_send({type: "reload"});
			break;
	}
};

funcs.on_keydown = function(event) {
	if (event.altKey)
		return;

	switch (event.keyCode) {
		case 87: //W
		case 38: //up
			if (!global.key_up)
			{
				global.key_up = true;
				funcs.move(constants.directions.up);
				event.preventDefault();
			}
			break;
		case 83: //S
		case 40: //down
			if (!global.key_down)
			{
				global.key_down = true;
				funcs.move(constants.directions.down);
				event.preventDefault();
			}
			break;
		case 65: //A
		case 37: //left
			if (!global.key_left)
			{
				global.key_left = true;
				funcs.move(constants.directions.left);
				event.preventDefault();
			}
			break;
		case 68: //D
		case 39: //right
			if (!global.key_right)
			{
				global.key_right = true;
				funcs.move(constants.directions.right);
				event.preventDefault();
			}
			break;
	}
	funcs.update_camera_target();
};

funcs.on_mousedown = function(event) {
	if (event.touches)
	{
		if (event.touches.length === 1)
			global.swipe_start.set(event.touches[0].pageX, event.touches[0].pageY);
	}
	else
		global.swipe_start.set(event.clientX, event.clientY);
	event.preventDefault();
};

funcs.on_mousemove = function(event) {
	if (event.touches)
	{
		if (event.touches.length === 1)
			global.swipe_pos.set(event.touches[0].pageX, event.touches[0].pageY);
	}
	else
		global.swipe_pos.set(event.clientX, event.clientY);
	event.preventDefault();
};

funcs.on_mouseup = function(event) {
	global.swipe_pos.sub(global.swipe_start);
	if (global.swipe_pos.length() > 10.0)
		funcs.move((2 + Math.round((Math.atan2(global.swipe_pos.x, -global.swipe_pos.y) - graphics.camera.rotation.y) / (Math.PI * 0.5))) % 4);
	event.preventDefault();
};

funcs.error = function(e) {
	console.log('ERROR');
	console.log(e);
	// TODO: error handling
};

funcs.move = function(dir) {
	funcs.ws_send({ type: 'moveEvent', dir: dir });
};

funcs.create_value_text = function(value, parent) {
	var value_string = Math.pow(2, value).toString();
	var scale = value_string.length === 1 ? 1.0 : 1.5 / value_string.length;
	var text_geometry = new THREE.TextGeometry(value_string, {
		size: 0.6 * scale,
		height: 0.1,
		curveSegments: 2,

		font: 'helvetiker',
		weight: 'bold',
		style: 'normal',

		bevelThickness: 0,
		bevelSize: 0,
		bevelEnabled: false,

		material: 0,
		extrudeMaterial: 0
	});
	var text = funcs.add_mesh(text_geometry, 0xffffff, null, parent);
	text_geometry.computeBoundingBox();
	text.position.z = 0.5;
	text.position.x = -0.05 - 0.5 * (text_geometry.boundingBox.max.x - text_geometry.boundingBox.min.x);
	text.position.y = -0.5 * (text_geometry.boundingBox.max.y - text_geometry.boundingBox.min.y);
	text.value = value;
	return text;
};

funcs.set_mesh = function(i, value, id) {
	var mesh = graphics.meshes[i];
	if (!mesh) {
		mesh = funcs.add_mesh(new THREE.BoxGeometry(1, 1, 1), 0xffffff);
		graphics.meshes[i] = mesh;
		var p = funcs.xy(i);
		mesh.position.x = p.x;
		mesh.position.y = p.y;
	}

	var refresh_text = false;
	if (mesh.children.length > 0) {
		refresh_text = mesh.children[0].value !== value;
		if (refresh_text)
			mesh.remove(mesh.children[0]);
	}
	else
		refresh_text = true;

	if (refresh_text)
		funcs.create_value_text(value, mesh);

	mesh.material.color.setHex(funcs.color_hash(id));
	mesh.material.needsUpdate = true;
	var cell_height = value * 0.1;
	mesh.scale.z = cell_height;
	mesh.position.z = cell_height * 0.5;
};

funcs.load_level = function(level) {
	// clear old stuff
	for (var i = 0; i < graphics.scenery.length; i++)
		graphics.scene.remove(graphics.scenery[i]);
	graphics.scenery.length = 0;
	for (var i = 0; i < graphics.animations.length; i++) {
		var anim = graphics.animations[i];
		if (anim.remove_mesh)
			graphics.scene.remove(anim.remove_mesh);
	}
	graphics.animations.length = 0;

	for (var i = 0; i < graphics.meshes.length; i++)
	{
		if (graphics.meshes[i])
		{
			graphics.scene.remove(graphics.meshes[i]);
			graphics.meshes[i] = null;
		}
	}

	// load new stuff

	state.size.set(level.grid.size.x, level.grid.size.y);
	state.values = new Array(state.size.x * state.size.y);
	state.ids = new Array(state.size.x * state.size.y);
	graphics.meshes = new Array(state.size.x * state.size.y);

	graphics.ground.material.map = graphics.texture_loader.load
	(
		'Level' + level.difficulty + 'B.png',
		function(texture) {
			texture.minFilter = texture.magFilter = THREE.NearestFilter;
			graphics.ground.material.needsUpdate = true;
		},
		funcs.error
	);
	
	for (var i = 0; i < state.values.length; i++)
	{
		state.values[i] = level.grid.cells[i].value;
		state.ids[i] = level.grid.cells[i].playerId;
	}

	graphics.ground.scale.set(state.size.x, state.size.y, 1);
	graphics.ground.position.set(state.size.x * 0.5 - 0.5, state.size.y * 0.5 - 0.5, 0);

	for (var i = 0; i < state.values.length; i++)
	{
		var value = state.values[i];
		if (value > 0) {
			if (state.ids[i] < 0) {
				// must be an exit
				var exit = new THREE.Mesh(graphics.exit_geometry, new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, blending: THREE.NormalBlending, map: graphics.exit_texture }));
				graphics.scene.add(exit);
				graphics.scenery.push(exit);
				var p = funcs.xy(i);
				exit.position.x = p.x;
				exit.position.y = p.y;
				var text = funcs.create_value_text(value, exit);
				text.castShadow = false;
			}
			else // normal number
				funcs.set_mesh(i, value, state.ids[i]);
		}
		else if (value < 0) {
			if (value === -1) {
				// obstacle
				var obstacle = funcs.add_mesh(new THREE.BoxGeometry(1, 1, 1), 0x333333);
				var p = funcs.xy(i);
				obstacle.position.x = p.x;
				obstacle.position.y = p.y;
				obstacle.position.z = 0.5;
				graphics.scenery.push(obstacle);
			}
			else {
				// this should never ever happen
			}
		}
	}

	funcs.update_camera_target();

	graphics.camera_pos.copy(graphics.camera_pos_target);
	graphics.camera_size = graphics.camera_size_target;
};

funcs.add_mesh = function(geometry, color, materials, parent) {
	var material;
	if (materials)
	{
		var material_clones = new Array(materials.length);
		var c = new THREE.Color(color);
		for (var i = 0; i < materials.length; i++)
		{
			material_clones[i] = new THREE.MeshPhongMaterial({ color: materials[i].color, specular: 0x000000 });
			material_clones[i].color.multiply(c);
		}
		material = new THREE.MeshFaceMaterial(material_clones);
	}
	else
		material = new THREE.MeshPhongMaterial({ color: color, specular: 0x000000 });
	var mesh = new THREE.Mesh(geometry, material);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	if (parent)
		parent.add(mesh);
	else
		graphics.scene.add(mesh);
	return mesh;
};

funcs.complete_animation = function(anim) {
	if (anim.remove_mesh)
		graphics.scene.remove(anim.remove_mesh);
	anim.mesh.position.x = anim.new_pos.x;
	anim.mesh.position.y = anim.new_pos.y;
	funcs.set_mesh(anim.new_cell, anim.value, anim.id);
};

funcs.animate = function() {
	requestAnimationFrame(funcs.animate);

	var dt = global.clock.getDelta();

	var cloud_max = new THREE.Vector2(state.size.x + constants.max_camera_size * 0.5, state.size.y + constants.max_camera_size * 0.5);
	var cloud_speed = constants.cloud_speed * dt;
	for (var i = 0; i < graphics.clouds.length; i++) {
		var cloud_pos = graphics.clouds[i].position;
		cloud_pos.x += cloud_speed;
		cloud_pos.y += cloud_speed;
		if (cloud_pos.x > cloud_max.x || cloud_pos.y > cloud_max.y) {
			cloud_pos.x = (constants.max_camera_size * -0.5) - (Math.random() * (state.size.x + constants.cloud_margin * 2.0));
			cloud_pos.y = (constants.max_camera_size * -0.5) - (Math.random() * (state.size.y + constants.cloud_margin * 2.0));
			cloud_pos.z = -6.0 + Math.random() * 3.0;
		}
	}

	if (!state.is_alive) {
		state.respawn_timer += dt;
		if (state.respawn_timer > constants.respawn_delay) {
			state.respawn_timer = 0.0;
			funcs.ws_send({ type: 'respawn' });
		}
	}

	for (var i = 0; i < graphics.animations.length; i++) {
		var anim = graphics.animations[i];
		anim.blend += dt * 15.0;
		if (anim.blend > 1.0) {
			funcs.complete_animation(anim);
			graphics.animations.splice(i, 1);
			i--;
		}
		else {
			anim.mesh.position.x = anim.pos.x + (anim.new_pos.x - anim.pos.x) * anim.blend;
			anim.mesh.position.y = anim.pos.y + (anim.new_pos.y - anim.pos.y) * anim.blend;
		}
	}

	graphics.camera_pos.lerp(graphics.camera_pos_target, dt * 10.0);

	graphics.camera_size = graphics.camera_size < graphics.camera_size_target
		? Math.min(graphics.camera_size_target, graphics.camera_size + dt * 10.0)
		: Math.max(graphics.camera_size_target, graphics.camera_size - dt * 10.0);

	graphics.camera.position.set(graphics.camera_pos.x, graphics.camera_pos.y, 0).add(constants.camera_offset);

	funcs.update_projection();

	graphics.renderer.render(graphics.scene, graphics.camera);
};

funcs.on_resize = function() {
	graphics.renderer.setSize(window.innerWidth, window.innerHeight);
};

funcs.update_projection = function() {
	var min_size = window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight;
	var zoom = graphics.camera_size / min_size;
	graphics.camera.left = -0.5 * window.innerWidth * zoom;
	graphics.camera.right = 0.5 * window.innerWidth * zoom;
	graphics.camera.top = 0.5 * window.innerHeight * zoom;
	graphics.camera.bottom = -0.5 * window.innerHeight * zoom;
	graphics.camera.updateProjectionMatrix();
};

funcs.id = function(x, y)
{
	return x + state.size.x * y;
};

funcs.xy = function(id)
{
	return new THREE.Vector2(id % state.size.x, Math.floor(id / state.size.x));
};

funcs.update_camera_target = function() {
	state.is_alive = false;
	if (state.player) {
		var min = new THREE.Vector2(state.size.x, state.size.y);
		var max = new THREE.Vector2(0, 0);
		graphics.camera_pos_target.set(0, 0);
		var count = 0;
		for (var i = 0; i < state.values.length; i++)
		{
			if (state.ids[i] === state.player.id && state.values[i] > 0)
			{
				var p = funcs.xy(i);
				min.x = Math.min(min.x, p.x);
				min.y = Math.min(min.y, p.y);
				max.x = Math.max(max.x, p.x);
				max.y = Math.max(max.y, p.y);
				graphics.camera_pos_target.add(p);
				count++;
			}
		}

		if (count > 0) {
			state.is_alive = true;
			graphics.camera_pos_target.multiplyScalar(1.0 / count);
			var size = Math.max(max.x - min.x, max.y - min.y);
			graphics.camera_size_target = Math.min(size + 6, constants.max_camera_size);
		}
	}

	if (!state.is_alive) {
		graphics.camera_pos_target.copy(state.size);
		graphics.camera_pos_target.multiplyScalar(0.5);
		var size = Math.max(state.size.x, state.size.y);
		graphics.camera_size_target = Math.min(size, constants.max_camera_size);
	}

	var d = constants.max_camera_size * 1.5;

	graphics.sunlight.shadow.camera.left = graphics.camera_pos_target.x - d;
	graphics.sunlight.shadow.camera.right = graphics.camera_pos_target.x + d;
	graphics.sunlight.shadow.camera.top = graphics.camera_pos_target.y + d;
	graphics.sunlight.shadow.camera.bottom = graphics.camera_pos_target.y - d;
	graphics.sunlight.shadow.camera.updateProjectionMatrix();
};

$(document).ready(function(){
	funcs.init();
});
