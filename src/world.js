import * as THREE from "three";
import { latheProfile, BELL_HEIGHT, PARTIALS } from "./profile.js";

const PALETTE = {
  bronze: 0x9a6b34,
  bronzeDark: 0x4a3620,
  verdigris: 0x46897b,
  pour: 0xf0b429,
};

export function createWorld(canvas) {
  // alpha: true — os dois campos (chapa clara e chão de fundição) são pintados
  // em CSS, e o sino é composto por cima da divisa entre eles.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    34,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  camera.position.set(0, 0, 8.2);

  // `layout.x` é animado pela timeline; a distância real vem do viewport.
  const layout = { x: 0 };
  const bell = new THREE.Group();
  // Centra o sino na própria altura, para ele girar sobre o eixo e não pender.
  bell.position.y = -BELL_HEIGHT / 2;
  const rig = new THREE.Group();
  rig.add(bell);
  scene.add(rig);

  const points = latheProfile().map(([x, y]) => new THREE.Vector2(x, y));
  const geometry = new THREE.LatheGeometry(points, 128);
  geometry.computeVertexNormals();

  const bronze = new THREE.MeshStandardMaterial({
    color: PALETTE.bronze,
    // Bronze de sino sai do molde fosco e granulado, não polido de vitrine.
    roughness: 0.62,
    metalness: 0.72,
    side: THREE.DoubleSide,
  });
  const shell = new THREE.Mesh(geometry, bronze);
  bell.add(shell);

  // Os cinco parciais como anéis nas alturas exatas em que são afinados. Cada
  // um acende quando a sua secção entra — daí `userData.glow`.
  const rings = PARTIALS.map((partial) => {
    const radiusAt = radiusAtHeight(partial.height);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radiusAt + 0.012, 0.008, 8, 128),
      new THREE.MeshBasicMaterial({
        color: PALETTE.verdigris,
        transparent: true,
        opacity: 0.12,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = partial.height;
    ring.userData.partial = partial.name;
    bell.add(ring);
    return ring;
  });

  const key = new THREE.DirectionalLight(0xfff2dd, 2.1);
  key.position.set(4, 5, 4);
  scene.add(key);

  // Luz de recorte fria: separa o bronze do campo escuro sem lavar a cor.
  const rim = new THREE.DirectionalLight(PALETTE.verdigris, 0.7);
  rim.position.set(-5, 1.5, -3.5);
  scene.add(rim);

  const forge = new THREE.PointLight(PALETTE.pour, 0, 14);
  forge.position.set(0, -1.6, 2.5);
  scene.add(forge);

  scene.add(new THREE.HemisphereLight(0xdfe6e2, 0x120f0c, 0.55));

  let offsetX = 0;
  let offsetY = 0;
  let scale = 1;

  function computeLayout() {
    const aspect = window.innerWidth / window.innerHeight;
    const narrow = aspect < 1;
    // Em tela larga o sino encosta na divisa dos campos, ao lado do desenho;
    // em tela estreita ele centra e recua para o texto poder passar por cima.
    // Em tela larga o sino fica inteiro do lado escuro, encostado na divisa:
    // é o que dá às guias dos parciais um vão para atravessar. No retrato ele
    // sobe para a metade de cima e o texto ocupa a de baixo.
    offsetX = narrow ? 0 : 0.112;
    offsetY = narrow ? 1.15 : 0;
    scale = narrow ? 0.92 : 1.1;
    camera.fov = narrow ? 46 : 34;
  }
  computeLayout();
  camera.updateProjectionMatrix();

  function resize() {
    const { innerWidth: w, innerHeight: h } = window;
    camera.aspect = w / h;
    computeLayout();
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
  }

  function applyLayout() {
    rig.position.x = offsetX + layout.x;
    rig.position.y = offsetY;
    rig.scale.setScalar(scale);
  }

  /**
   * Deixa as matrizes prontas para projetar pontos do sino em pixels sem
   * depender de um render ter acontecido antes. A câmera não está no grafo da
   * cena, então a inversa dela é responsabilidade nossa.
   */
  function syncMatrices() {
    applyLayout();
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  }

  function render() {
    applyLayout();
    renderer.render(scene, camera);
  }

  function dispose() {
    geometry.dispose();
    bronze.dispose();
    rings.forEach((r) => {
      r.geometry.dispose();
      r.material.dispose();
    });
    renderer.dispose();
  }

  return {
    renderer,
    scene,
    camera,
    rig,
    bell,
    shell,
    rings,
    forge,
    layout,
    resize,
    render,
    syncMatrices,
    dispose,
  };
}

/** Raio do contorno externo numa dada altura, por interpolação linear. */
function radiusAtHeight(height) {
  const outer = latheProfile();
  for (let i = 0; i < outer.length - 1; i += 1) {
    const [x1, y1] = outer[i];
    const [x2, y2] = outer[i + 1];
    if ((height >= y1 && height <= y2) || (height <= y1 && height >= y2)) {
      const t = y2 === y1 ? 0 : (height - y1) / (y2 - y1);
      return x1 + (x2 - x1) * t;
    }
  }
  return 0.5;
}
