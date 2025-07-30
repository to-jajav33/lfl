import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import { pinkyPromiseGenerator } from "./libs/pinkyPromiseGenerator";

export class Main {
  private root: Main;
  private container: HTMLElement;
  private _renderer: THREE.WebGLRenderer;
  private _camera: THREE.PerspectiveCamera;
  private controls?: OrbitControls;

  public scene: THREE.Scene;
  mainTimeline: gsap.core.Timeline;
  startOfFrame: number = performance.now();
  fps: number = 60;
  constructor(container: HTMLElement, { addHelpers = true, fps = 60 }: { addHelpers?: boolean, fps?: number }) {
    this.loop = this.loop.bind(this);

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

    this._camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this._camera.position.set(0, 10, 10);
    this._camera.lookAt(0, 0, 0);

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
      const gridSize = 10;
      const gridColor = 0x550000;
      const gridHelper = new THREE.GridHelper(
        gridSize,
        gridSize,
        gridColor,
        gridColor
      );
      this.scene.add(gridHelper);

      // Grid vertical
      const gridSizeVertical = 10;
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
  }

  get camera() {
    return this._camera;
  }

  get renderer() {
    return this._renderer;
  }

  tweenTo(target: gsap.TweenTarget, duration: number, vars: gsap.TweenVars, ease: gsap.EaseFunction, label: string = ""): gsap.core.Timeline & { whenComplete: Promise<void> } {
    const prom = pinkyPromiseGenerator();

    const tween = this.mainTimeline.to(target, {
      ...vars,
      duration,
      ease,
      onComplete: prom.forceResolve(vars.onComplete) as any
    }, label);

    tween.whenComplete = prom;

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
