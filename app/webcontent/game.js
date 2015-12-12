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
		-0.5 * window.innerWidth,
		0.5 * window.innerWidth,
		0.5 * window.innerHeight,
		-0.5 * window.innerHeight,
		1, 10000
	);
	graphics.camera.position.z = 1000;

	var geometry = new THREE.BoxGeometry(200, 200, 200);
	var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

	graphics.mesh = new THREE.Mesh(geometry, material);
	graphics.scene.add(graphics.mesh);

	graphics.renderer = new THREE.WebGLRenderer();
	graphics.renderer.setSize(window.innerWidth, window.innerHeight);

	document.body.appendChild(graphics.renderer.domElement);

	functions.animate();
}

functions.animate = function() {

	requestAnimationFrame(functions.animate);

	graphics.mesh.rotation.x += 0.01;
	graphics.mesh.rotation.y += 0.02;

	graphics.renderer.render(graphics.scene, graphics.camera);
}

functions.on_resize = function() {
	graphics.camera.left = -0.5 * window.innerWidth;
	graphics.camera.right = 0.5 * window.innerWidth;
	graphics.camera.top = 0.5 * window.innerHeight;
	graphics.camera.bottom = -0.5 * window.innerHeight;
	graphics.camera.updateProjectionMatrix();

	graphics.renderer.setSize(window.innerWidth, window.innerHeight);
}

$(document).ready(functions.init);
