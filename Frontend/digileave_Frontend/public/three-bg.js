// /public/three-bg.js
(function () {
  // Guard if THREE not loaded
  if (!window.THREE) {
    console.error("THREE not found. Make sure the <script> CDN tags are in index.html.");
    return;
  }

  const scene = new THREE.Scene();

  // Camera (like your planet code)
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;
  camera.lookAt(scene.position);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.id = "digi-bg";
  document.body.appendChild(renderer.domElement);

  // Background tint (optional)
  scene.background = new THREE.Color(0xefefef);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.12));
  const dir = new THREE.DirectionalLight(0xffffff, 1);
  dir.position.set(3, 3, 2);
  scene.add(dir);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  // Load the GLB logo
  let logo = null;
  new THREE.GLTFLoader().load(
    "/DigitollLogo.glb",
    (gltf) => {
      logo = gltf.scene;
      scene.add(logo);

      // Center model
      const box = new THREE.Box3().setFromObject(logo);
      const center = box.getCenter(new THREE.Vector3());
      logo.position.sub(center);

      // Orientation (from your file)
      logo.rotation.x = -Math.PI / 2;
      logo.rotation.y -= Math.PI;
      logo.rotation.z -= Math.PI;
    },
    undefined,
    (err) => console.error("GLB load error:", err)
  );

  // Mouse → camera easing
  let mouseX = 0,
    mouseY = 0;
  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  function animate() {
    requestAnimationFrame(animate);

    if (logo) logo.rotation.z -= 0.008; // gentle spin

    camera.position.x += (mouseX * 2 - camera.position.x) * 0.025;
    camera.position.y += (mouseY * 2 - camera.position.y) * 0.025;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();

  // Resize handling
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
