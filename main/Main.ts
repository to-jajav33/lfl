import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import { pinkyPromiseGenerator } from "./libs/pinkyPromiseGenerator";

export class Main {
  private root: Main;
  private container: HTMLElement;
  private _renderer: THREE.WebGLRenderer;
  private _camera: THREE.OrthographicCamera | THREE.PerspectiveCamera;
  private controls?: OrbitControls;

  public scene: THREE.Scene;
  mainTimeline: gsap.core.Timeline;
  startOfFrame: number = performance.now();
  fps: number = 60;
  constructor(container: HTMLElement, { addHelpers = true, fps = 60, cameraType = "orthographic" }: { addHelpers?: boolean, fps?: number, cameraType?: "orthographic" | "perspective" }) {
    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);

    this.root = this;
    this.container = container;
    this.fps = fps;

    const computedStyles = getComputedStyle(this.container);
    const width = parseInt(computedStyles.width);
    const height = parseInt(computedStyles.height);

    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this._renderer.setSize(width, height);
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setClearColor(0xfefefe, 1);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._renderer.shadowMap.autoUpdate = true;
    this._renderer.shadowMap.needsUpdate = true;
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const near = 0.1;
    const far = 1000;
    if (cameraType === "orthographic") {
      this._camera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, near, far);
    } else {
      this._camera = new THREE.PerspectiveCamera(75, width / height, near, far);
    }
    this._camera.position.set(0, 0, 10);
    // this._camera.lookAt(0, 0, 0);

    this.scene = new THREE.Scene();

    this.scene.add(this._camera);

    if (addHelpers) {
      // Controls
      this.controls = new OrbitControls(
        this._camera,
        this._renderer.domElement
      );
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.25;

      // Grid
      const gridSize = width;
      const gridColor = 0x550000;
      const gridHelper = new THREE.GridHelper(
        gridSize,
        gridSize,
        gridColor,
        gridColor
      );
      this.scene.add(gridHelper);

      // Grid vertical
      const gridSizeVertical = height;
      const gridColorVertical = 0x005500;
      const gridHelperVertical = new THREE.GridHelper(
        gridSizeVertical,
        gridSizeVertical,
        gridColorVertical,
        gridColorVertical
      );
      gridHelperVertical.rotateX(-Math.PI * 0.5);
      this.scene.add(gridHelperVertical);

      // Axes
      const axesSize = 4;
      const axesHelper = new THREE.AxesHelper(axesSize);
      this.scene.add(axesHelper);
    }

    this.container.appendChild(this._renderer.domElement);

    this.mainTimeline = gsap.timeline();
    this.loop();

    window.addEventListener("resize", this.resize);
    this.resize();
  }

  get camera() {
    return this._camera;
  }

  get renderer() {
    return this._renderer;
  }

  getOtherBoundingBox(other: THREE.Object3D) {
    const boundingBox = new THREE.Box3().setFromObject(other, true);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    return size;
  }

  resize() {
    const computedStyles = getComputedStyle(this.container);
    const width = parseInt(computedStyles.width);
    const height = parseInt(computedStyles.height);
    const aspect = width / height;

    if (this._camera instanceof THREE.OrthographicCamera) {
      const WORLD_WIDTH_HEIGHT = 1024; // Example: Adjust this value to your liking

      let frustumWidth;
      let frustumHeight;

      // Determine if the window is in landscape or portrait mode
      if (width > height) { // Landscape
        frustumHeight = WORLD_WIDTH_HEIGHT;
        frustumWidth = frustumHeight * aspect;
      } else { // Portrait or square
        frustumWidth = WORLD_WIDTH_HEIGHT;
        frustumHeight = frustumWidth / aspect;
      }

      this._camera.left = -frustumWidth / 2;
      this._camera.right = frustumWidth / 2;
      this._camera.top = frustumHeight / 2;
      this._camera.bottom = -frustumHeight / 2;
    } else {
      this._camera.aspect = aspect;
    }
    this._camera.updateProjectionMatrix();

    this._renderer.setSize(width, height);
  }

  tweenTo(target: gsap.TweenTarget, duration: number, vars: gsap.TweenVars, ease: gsap.EaseFunction, label: string = ""): gsap.core.Timeline & { whenComplete: Promise<void> } {
    const prom = pinkyPromiseGenerator();

    if (label === ":playhead") {
      label = this.mainTimeline.totalTime().toFixed(2);
    }

    const tween = this.mainTimeline.to(target, {
      ...vars,
      duration,
      ease,
      onComplete: prom.forceResolve(vars.onComplete) as any
    }, label);

    tween.whenComplete = prom;
    tween.labelStart = label;
    tween.labelEnd = `${label}+=${duration.toFixed(2)}`;

    return tween as unknown as gsap.core.Timeline & { whenComplete: Promise<void> };
  }

  loop() {
    const now = performance.now();
    const delta = now - this.startOfFrame;

    if (delta >= (1000 / this.fps)) {
      this.controls?.update();
      this._renderer.render(this.scene, this._camera);
      this.startOfFrame = now;
    }

    requestAnimationFrame(this.loop);
  }
}

export default Main;
