import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

class Main {
  private root: Main;
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;

  constructor(container: HTMLElement) {
    this.loop = this.loop.bind(this);

    this.root = this;
    this.container = container;

    const computedStyles = getComputedStyle(this.container);
    const width = parseInt(computedStyles.width);
    const height = parseInt(computedStyles.height);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0xfefefe, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = true;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(0, 10, 10);
    this.camera.lookAt(0, 0, 0);

    this.scene = new THREE.Scene();

    this.scene.add(this.camera);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;

    // Grid
    const gridSize = 10;
    const gridColor = 0x000000;
    const gridHelper = new THREE.GridHelper(
      gridSize,
      gridSize,
      gridColor,
      gridColor
    );
    this.scene.add(gridHelper);

    // Axes
    const axesSize = 4;
    const axesHelper = new THREE.AxesHelper(axesSize);
    this.scene.add(axesHelper);

    this.container.appendChild(this.renderer.domElement);

    this.loop();
  }

  loop() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.loop);
  }
}

export const main = new Main(
  document.getElementById("canvas-container") as HTMLElement
);
