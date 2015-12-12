var constants = {
	zoom: 5.0,
};

var graphics = {
	scene: null,
	camera: null,
	renderer: null,
	material: null,
	mesh: null,
};

var functions = {};

functions.init = function() {

	window.addEventListener('resize', functions.on_resize, false);

	graphics.scene = new THREE.Scene();

	graphics.camera = new THREE.OrthographicCamera
	(
		-1,
		1,
		1,
		-1,
		0.01, 1000
	);
	graphics.camera.rotation.x = Math.PI * -0.25;
	graphics.camera.rotation.y = Math.PI * 0.25;
	graphics.camera.position.x = 1;
	graphics.camera.position.y = 1;
	graphics.camera.position.z = 1;

	{
		var dirLight = new THREE.DirectionalLight(0xffffff, 1);
		dirLight.color.setHSL(0.1, 1, 0.95);
		dirLight.position.set(-1, 1.75, 1);
		dirLight.position.multiplyScalar(50);
		graphics.scene.add(dirLight);

		dirLight.castShadow = true;

		dirLight.shadowMapWidth = 2048;
		dirLight.shadowMapHeight = 2048;

		var d = constants.zoom * 1.5 * 0.5;

		dirLight.shadowCameraLeft = -d;
		dirLight.shadowCameraRight = d;
		dirLight.shadowCameraTop = d;
		dirLight.shadowCameraBottom = -d;

		dirLight.shadowCameraFar = 3500;
		dirLight.shadowBias = -0.0001;
	}

	var geometry = new THREE.BoxGeometry(1, 1, 1);
	var material = new THREE.MeshPhongMaterial({ color: 0xff0000 });

	graphics.mesh = new THREE.Mesh(geometry, material);
	graphics.mesh.castShadow = true;
	graphics.mesh.receiveShadow = true;
	graphics.scene.add(graphics.mesh);

	var groundGeo = new THREE.PlaneBufferGeometry(100, 100);
	var groundMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
	groundMat.color.setHSL(0.095, 1, 0.75);

	var ground = new THREE.Mesh(groundGeo, groundMat);
	ground.rotation.x = -0.5 * Math.PI;
	ground.position.y = -1;
	ground.receiveShadow = true;
	graphics.scene.add(ground);

	graphics.renderer = new THREE.WebGLRenderer();
	graphics.renderer.setSize(window.innerWidth, window.innerHeight);

	graphics.renderer.gammaInput = true;
	graphics.renderer.gammaOutput = true;

	graphics.renderer.shadowMap.enabled = true;
	graphics.renderer.shadowMap.cullFace = THREE.CullFaceBack;
	graphics.renderer.shadowMap.type = THREE.PCFShadowMap;

	document.body.appendChild(graphics.renderer.domElement);

	functions.on_resize();
	functions.animate();
}

functions.animate = function() {

	requestAnimationFrame(functions.animate);

	graphics.mesh.rotation.x += 0.01;
	graphics.mesh.rotation.y += 0.02;

	graphics.renderer.render(graphics.scene, graphics.camera);
}

functions.on_resize = function() {
	var min_size = window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight;
	var zoom = constants.zoom / min_size;
	graphics.camera.left = -0.5 * window.innerWidth * zoom;
	graphics.camera.right = 0.5 * window.innerWidth * zoom;
	graphics.camera.top = 0.5 * window.innerHeight * zoom;
	graphics.camera.bottom = -0.5 * window.innerHeight * zoom;
	graphics.camera.updateProjectionMatrix();

	graphics.renderer.setSize(window.innerWidth, window.innerHeight);
}

$(document).ready(functions.init);
