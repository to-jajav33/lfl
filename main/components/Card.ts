import * as THREE from "three";
import { CustomObject3D } from "./CustomObject3D";
import { Main } from "../Main";
import { InputManager } from "../libs/InputManager";
import * as gsap from "gsap";

export class Card extends CustomObject3D {
  inputManager: InputManager;
  isFaceUp: boolean;
  lastFlipTween: InstanceType<typeof gsap.default.core.Timeline> & { whenComplete: Promise<void> } | null;
  lastScaleTween: InstanceType<typeof gsap.default.core.Timeline> & { whenComplete: Promise<void> } | null;

  constructor(root: Main) {
    super(root);

    this.flip = this.flip.bind(this);
    this.scaleUp = this.scaleUp.bind(this);
    this.scaleDown = this.scaleDown.bind(this);

    this.isFaceUp = false;
    this.lastFlipTween = null;
    this.lastScaleTween = null;

    const cardRatio = 3 / 2.5;
    const cardThickness = 0.01;
    const cardGeometry = new THREE.BoxGeometry(
      1 / cardRatio,
      cardRatio,
      cardThickness
    );
    const cardMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);
    this.add(cardMesh);

    this.inputManager = new InputManager(
      this.root.renderer.domElement,
      {
        selected: {
          click: (_ev, action) => (action.isHitTestSuccess),
        },
        scaleUp: {
          ":hoverIn": () => true,
        },
        scaleDown: {
          ":hoverOut": () => true,
        },
      },
      this.root.camera,
      this
    );
    this.inputManager.eventEmitter.on("selected", this.flip);
    this.inputManager.eventEmitter.on("scaleUp", this.scaleUp);
    this.inputManager.eventEmitter.on("scaleDown", this.scaleDown);

    this.addEventListener("removed", () => {
      this.inputManager.destroy();
    });
  }

  flip(action: { isHitTestSuccess: boolean }) {
    if (action.isHitTestSuccess) {
      console.log("selected");
      const duration = 0.125;
      this.lastFlipTween?.kill();

      if (!this.isFaceUp) {
        this.lastFlipTween = this.root.tweenTo(this.rotation, duration, {
          y: Math.PI,
        }, gsap.Linear.easeNone, ">");
      } else {
        this.lastFlipTween = this.root.tweenTo(this.rotation, duration, {
          y: 0
        }, gsap.Linear.easeNone, ">");
      }
      this.isFaceUp = !this.isFaceUp;
    }
  }

  scaleUp(action: { isHitTestSuccess: boolean }) {
    console.log("scale up");
    const duration = 0.125;
    this.lastScaleTween?.kill();

    this.lastScaleTween = this.root.tweenTo(this.scale, duration, {
      x: 1.1,
      y: 1.1,
      z: 1.0,
    }, gsap.Linear.easeNone, ">");
  }

  scaleDown(action: { isHitTestSuccess: boolean }) {
    console.log("scale down");
    const duration = 0.125;
    this.lastScaleTween?.kill();

    this.lastScaleTween = this.root.tweenTo(this.scale, duration, {
      x: 1.0,
      y: 1.0,
      z: 1.0,
    }, gsap.Linear.easeNone, ">");
  }
}
