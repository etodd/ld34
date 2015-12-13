// state

var constants = {
	ws_url: (window.location.protocol === 'http:' ? 'ws://' : 'wss://') + window.location.host + '/event',
	max_camera_size: 25.0,
	camera_offset: new THREE.Vector3(),
	directions: {
		down: 0,
		left: 1,
		up: 2,
		right: 3,
	},
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
};

var state = {
	values: [],
	ids: [],
	size: new THREE.Vector2(),
};

var graphics = {
	animations: [],
	scenery: [],
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
	if (msg.type === 'initState')
		funcs.load_level(msg.level);
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
	global.ws.onmessage = function(msg)
	{
		funcs.ws_on_message(JSON.parse(msg.data));
	};
	global.ws.onclose = funcs.ws_on_close;
};


funcs.color_hash = function(id) {
	return constants.color_table[id % constants.color_table.length];
};

funcs.init = function() {
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

funcs.error = function() {
	// TODO: error handling
};

funcs.move = function(dir) {
	funcs.ws_send({ type: 'moveEvent', dir: dir });
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

	if (refresh_text) {
		var value_string = Math.pow(2, value).toString();
		var scale = 1.0 - (value_string.length * 0.25);
		var text_geometry = new THREE.TextGeometry(value_string, {
			size: 0.8 * scale,
			height: 0.8 * (2.0 / 7.0) * scale,
			curveSegments: 4,

			font: 'helvetiker',
			weight: 'bold',
			style: 'normal',

			bevelThickness: 0,
			bevelSize: 0,
			bevelEnabled: false,

			material: 0,
			extrudeMaterial: 0
		});
		var text = funcs.add_mesh(text_geometry, 0xffffff, null, mesh);
		text_geometry.computeBoundingBox();
		text.position.z = 0.5;
		text.position.x = -0.5 * (text_geometry.boundingBox.max.x - text_geometry.boundingBox.min.x);
		text.position.y = -0.5 * (text_geometry.boundingBox.max.y - text_geometry.boundingBox.min.y);
		text.value = value;
	}

	mesh.material.color.setHex(funcs.color_hash(id));
	mesh.material.needsUpdate = true;
	var cell_height = value * 0.1;
	mesh.scale.z = cell_height;
	mesh.position.z = cell_height * 0.5;
};

funcs.load_level = function(level) {
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

	state.size.set(level.grid.size.x, level.grid.size.y);
	state.values = new Array(state.size.x * state.size.y);
	state.ids = new Array(state.size.x * state.size.y);
	graphics.meshes = new Array(state.size.x * state.size.y);

	graphics.ground.material.map = graphics.texture_loader.load
	(
		'TestLevelV6.png',
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
		if (value > 0)
			funcs.set_mesh(i, value, state.ids[i]);
	}

	funcs.update_camera_target();

	graphics.camera_pos.copy(graphics.camera_pos_target);
	graphics.camera_size = graphics.camera_size_target;

	graphics.model_loader.load('3DModels/StairsV1.js', function(geometry, materials) {
		var up = funcs.add_mesh(geometry, 0xffffff, materials);
		graphics.scenery.push(up);
		up.position.x = 0.5 * state.size.x;
		up.position.y = 1.0 * state.size.y;
		up.rotation.z = Math.PI * -0.5;

		var left = funcs.add_mesh(geometry, 0xffffff, materials);
		graphics.scenery.push(left);
		left.position.x = 0.0 * state.size.x;
		left.position.y = 0.5 * state.size.y;
		left.rotation.z = Math.PI * 0;

		var right = funcs.add_mesh(geometry, 0xffffff, materials);
		graphics.scenery.push(right);
		right.position.x = 1.0 * state.size.x;
		right.position.y = 0.5 * state.size.y;
		right.rotation.z = Math.PI * 1;

		var down = funcs.add_mesh(geometry, 0xffffff, materials);
		graphics.scenery.push(down);
		down.position.x = 0.5 * state.size.x;
		down.position.y = 0 * state.size.y;
		down.rotation.z = Math.PI * 0.5;
	});

	/*
	for (var j = 1; j <= 8; j++) {
		graphics.model_loader.load('3DModels/BuildingV' + j.toString() + '.js', function(geometry, materials) {
			for (var i = 0; i < 2; i++) {
				var tree = funcs.add_mesh(geometry, funcs.color_hash(i), materials);
				tree.position.x = Math.floor(Math.random() * state.size.x);
				tree.position.y = Math.floor(Math.random() * state.size.y);
				graphics.meshes[funcs.id(tree.position.x, tree.position.y)] = tree;
			}
		});
	}
	*/
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
	var dt = global.clock.getDelta();

	requestAnimationFrame(funcs.animate);

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
		? Math.min(graphics.camera_size_target, graphics.camera_size + dt * 3.0)
		: Math.max(graphics.camera_size_target, graphics.camera_size - dt * 3.0);

	graphics.camera.position.set(graphics.camera_pos.x, graphics.camera_pos.y, 0).add(constants.camera_offset);

	funcs.update_projection();

	graphics.renderer.render(graphics.scene, graphics.camera);
}

funcs.on_resize = function() {
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

funcs.id = function(x, y)
{
	return x + state.size.x * y;
};

funcs.xy = function(id)
{
	return new THREE.Vector2(id % state.size.x, Math.floor(id / state.size.x));
};

funcs.update_camera_target = function() {
	var min = new THREE.Vector2(state.size.x, state.size.y);
	var max = new THREE.Vector2(0, 0);
	var average = new THREE.Vector2();
	var count = 0;
	for (var i = 0; i < state.values.length; i++)
	{
		if (state.ids[i] === 12 && state.values[i] > 0)
		{
			var p = funcs.xy(i);
			min.x = Math.min(min.x, p.x);
			min.y = Math.min(min.y, p.y);
			max.x = Math.max(max.x, p.x);
			max.y = Math.max(max.y, p.y);
			average.add(p);
			count++;
		}
	}
	average.multiplyScalar(1.0 / count);
	graphics.camera_pos_target.copy(average);
	var size = Math.max(max.x - min.x, max.y - min.y);
	graphics.camera_size_target = Math.min(size + 6, constants.max_camera_size);

	var d = constants.max_camera_size * 1.5;

	graphics.sunlight.shadow.camera.left = graphics.camera_pos_target.x - d;
	graphics.sunlight.shadow.camera.right = graphics.camera_pos_target.x + d;
	graphics.sunlight.shadow.camera.top = graphics.camera_pos_target.y + d;
	graphics.sunlight.shadow.camera.bottom = graphics.camera_pos_target.y - d;
	graphics.sunlight.shadow.camera.updateProjectionMatrix();
};

$(document).ready(funcs.init);
