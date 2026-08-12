import * as THREE from "three";

const PALETTE = {
  background: 0xf2ece2,
  solid: 0x14110f,
  wire: 0xd2601a,
};

// Deforma a esfera do icosaedro com um ruído barato e determinístico, para o
// objeto não parecer uma primitiva pronta.
function displace(geometry, amount) {
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i);
    const noise =
      Math.sin(vertex.x * 2.1) * Math.cos(vertex.y * 1.7) +
      Math.sin(vertex.z * 2.6) * 0.5;
    vertex.setLength(1 + noise * amount);
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
}

export function createWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.background);
  scene.fog = new THREE.Fog(PALETTE.background, 6, 16);

  const camera = new THREE.PerspectiveCamera(
    38,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  camera.position.set(0, 0, 7);

  // O objeto fica ao lado do texto: `layout.side` (-1 a 1) é animado pela
  // timeline e a distância real vem do viewport, para não colidir no mobile.
  const layout = { side: 1 };
  const group = new THREE.Group();
  scene.add(group);

  let offsetX = 0;
  let groupScale = 1;

  function computeLayout() {
    const aspect = window.innerWidth / window.innerHeight;
    const portrait = aspect < 0.9;
    // Retrato: quase sem deslocamento, objeto menor e câmera mais aberta,
    // porque não há espaço lateral para colocar a cena ao lado do texto.
    offsetX = portrait ? 0.3 : Math.min(1.7, (aspect - 0.6) * 1.6);
    groupScale = portrait ? 0.8 : 1;
    camera.fov = portrait ? 48 : 38;
  }
  computeLayout();
  camera.updateProjectionMatrix();

  const geometry = new THREE.IcosahedronGeometry(1, 24);
  displace(geometry, 0.16);

  const solid = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: PALETTE.solid,
      roughness: 0.45,
      metalness: 0.1,
      flatShading: true,
    }),
  );
  group.add(solid);

  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.32, 2),
    new THREE.MeshBasicMaterial({
      color: PALETTE.wire,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    }),
  );
  group.add(wire);

  // Campo de pontos que dá profundidade ao "mundo" quando a câmera se move.
  const starCount = 900;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    starPositions[i * 3] = (Math.random() - 0.5) * 24;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 24;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 24;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(starPositions, 3),
  );
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: PALETTE.solid,
      size: 0.035,
      transparent: true,
      opacity: 0.35,
    }),
  );
  scene.add(stars);

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 4, 5);
  scene.add(key);

  const rim = new THREE.DirectionalLight(PALETTE.wire, 1.8);
  rim.position.set(-4, -2, -3);
  scene.add(rim);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));

  function resize() {
    const { innerWidth: w, innerHeight: h } = window;
    camera.aspect = w / h;
    computeLayout();
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
  }

  function render() {
    group.position.x = layout.side * offsetX;
    group.scale.setScalar(groupScale);
    renderer.render(scene, camera);
  }

  function dispose() {
    geometry.dispose();
    solid.material.dispose();
    wire.geometry.dispose();
    wire.material.dispose();
    starGeometry.dispose();
    stars.material.dispose();
    renderer.dispose();
  }

  return {
    renderer,
    scene,
    camera,
    group,
    layout,
    solid,
    wire,
    stars,
    resize,
    render,
    dispose,
  };
}
