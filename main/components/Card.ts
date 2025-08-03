import * as THREE from "three";
import { CustomObject3D } from "./CustomObject3D";
import { Main } from "../Main";
import { InputManager } from "../libs/InputManager";
import * as AllGSAP from "gsap";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import * as FontHelvetikerJSON from "three/examples/fonts/helvetiker_regular.typeface.json";

export class Card extends CustomObject3D {
  cardId: number = 0;
  inputManager: InputManager;
  isFaceUp: boolean;
  lastFlipTween: InstanceType<typeof AllGSAP.default.core.Timeline> & { whenComplete: Promise<void> } | null;
  lastScaleTween: InstanceType<typeof AllGSAP.default.core.Timeline> & { whenComplete: Promise<void> } | null;

  constructor(root: Main, label: string = "?", width: number = 1) {
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
      width / cardRatio,
      cardRatio * width,
      cardThickness
    );
    const cardMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);
    this.add(cardMesh);

    const font = new FontLoader().parse(FontHelvetikerJSON);
    const labelGeometry = new TextGeometry(label, {
      font,
      size: 0.5,
      depth: 0.01,
    });
    const labelMesh = new THREE.Mesh(labelGeometry, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    labelMesh.position.set(-this.getOtherBoundingBox(labelMesh).x * 0.5, - this.boundingBox.y * 0.5 + this.getOtherBoundingBox(labelMesh).y * 0.5, 0.0);
    this.add(labelMesh);

    this.inputManager = new InputManager(
      this.root.renderer.domElement,
      {
        dragStart: {
          ":dragStart": (_ev, _action) => true,
        },
        dragMove: {
          ":dragMove": (_ev, _action) => true,
        },
        dragEnd: {
          ":dragEnd": (_ev, _action) => true,
        },
        selected: {
          ":click": (_ev, _action) => true,
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

    this.addEventListener("added", () => {
      console.log("added");
      this.inputManager.init();
    });

    this.addEventListener("removed", () => {
      console.log("removed");
      this.inputManager.destroy();
    });
  }

  flip(action: { isHitTestSuccess: boolean }) {
    const duration = 0.125;

    if (!this.isFaceUp) {
      this.lastFlipTween = this.root.tweenTo(this.rotation, duration, {
        y: Math.PI,
      }, AllGSAP.Linear.easeNone, ":playhead");
    } else {
      this.lastFlipTween = this.root.tweenTo(this.rotation, duration, {
        y: 0
      }, AllGSAP.Linear.easeNone, ":playhead");
    }
    this.isFaceUp = !this.isFaceUp;
  }

  scaleUp(action: { isHitTestSuccess: boolean }) {
    const duration = 0.125;

    this.lastScaleTween = this.root.tweenTo(this.scale, duration, {
      x: 1.1,
      y: 1.1,
      z: 1.0,
    }, AllGSAP.Linear.easeNone, ":playhead");
  }

  scaleDown(action: { isHitTestSuccess: boolean }) {
    const duration = 0.125;

    this.lastScaleTween = this.root.tweenTo(this.scale, duration, {
      x: 1.0,
      y: 1.0,
      z: 1.0,
    }, AllGSAP.Linear.easeNone, ":playhead");
  }
}
