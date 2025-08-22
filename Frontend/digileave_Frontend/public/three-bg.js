(function () {
  if (!window.THREE) {
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;
  camera.lookAt(scene.position);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // CRUCIAL FOR MOBILE RENDERING
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.id = "digi-bg";
  document.body.appendChild(renderer.domElement);

  function applyThemeBg() {
    const root = document.documentElement;
    const cssBg =
      getComputedStyle(root).getPropertyValue("--color-bg").trim() || "#eeeeee";
    try {
      scene.background = new THREE.Color(cssBg);
    } catch {
      // fallback if var is missing or invalid
      scene.background = new THREE.Color(0x111111);
    }
  }

  // Initial background from current theme
  applyThemeBg();

  // React to theme changes (Header toggles data-theme on <html>)
  const themeObserver = new MutationObserver(() => applyThemeBg());
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.12));
  const dir = new THREE.DirectionalLight(0xffffff, 1);
  dir.position.set(3, 3, 2);
  scene.add(dir);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));


  let logo = null;
  new THREE.GLTFLoader().load(
    "/DigitollLogo.glb",
    (gltf) => {
      logo = gltf.scene;
      scene.add(logo);

      const box = new THREE.Box3().setFromObject(logo);
      const center = box.getCenter(new THREE.Vector3());
      logo.position.sub(center);

      logo.rotation.x = -Math.PI / 2;
      logo.rotation.y -= Math.PI;
      logo.rotation.z -= Math.PI;
    },
    undefined,
    (err) => console.error("GLB load error:", err)
  );


  let mouseX = 0,
    mouseY = 0;
  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  function animate() {
    requestAnimationFrame(animate);

    if (logo) logo.rotation.z -= 0.008;

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
