import * as THREE from "three";
import { CustomObject3D } from "./CustomObject3D";
import { Main } from "../Main";
import { InputManager } from "../libs/InputManager";
import * as AllGSAP from "gsap";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import * as FontHelvetikerJSON from "three/examples/fonts/helvetiker_regular.typeface.json";
// @ts-ignore
import flipFragmentShader from "../shaders/flip.fragment.glsl" with { type: "text" };
// @ts-ignore
import flipVertexShader from "../shaders/flip.vertex.glsl" with { type: "text" };
// @ts-ignore
import cardBackTexturePath from "../assets/card-back.png";
// @ts-ignore
import cardFrontTexturePath from "../assets/card-front.png";
// @ts-ignore
import emptyTexturePath from "../assets/empty.png";
import { gen2DTextTexture } from "../libs/generate2DTextTexture";

type Uniforms = {
  uColor: { value: THREE.Color };
  uRotate: { value: number };
  uTexture: { value: THREE.Texture };
  uTiltX: { value: number };
  uUseColor: { value: boolean };
};

export class Card extends CustomObject3D {
  cardId: number = 0;
  inputManager: InputManager;
  isFaceUp: boolean;
  lastFlipTween: InstanceType<typeof AllGSAP.default.core.Timeline> & { whenComplete: Promise<void> } | null;
  lastScaleTween: InstanceType<typeof AllGSAP.default.core.Timeline> & { whenComplete: Promise<void> } | null;
  labelValue: string;
  uniformsBack: Uniforms;
  uniformsFront: Uniforms;
  uniformsLabel: Uniforms;
  uniformsTitle: Uniforms;
  uniformsDescription: Uniforms;
  textureLoader: THREE.TextureLoader;
  labelMesh: THREE.Mesh;
  titleMesh: THREE.Mesh;

  constructor(root: Main, label: string = "?", width: number = 1) {
    super(root);

    this.labelValue = label;

    this.flip = this.flip.bind(this);
    this.scaleUp = this.scaleUp.bind(this);
    this.scaleDown = this.scaleDown.bind(this);

    this.isFaceUp = false;
    this.lastFlipTween = null;
    this.lastScaleTween = null;
    this.textureLoader = new THREE.TextureLoader();

    const cardRatio = 3 / 2.5;
    const cardThickness = 0.01;
    const subdivision = 32;

    const hitBoxGeometry = new THREE.BoxGeometry(width / cardRatio, cardRatio * width, cardThickness);
    const hitBoxMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.01 });
    const hitBoxMesh = new THREE.Mesh(hitBoxGeometry, hitBoxMaterial);
    this.add(hitBoxMesh);

    this.uniformsBack = {
      uColor: { value: new THREE.Color(0xFFFFFF) },
      uRotate: { value: Math.PI * 1.0 },
      uTexture: { value: this.textureLoader.load(cardBackTexturePath) },
      uTiltX: { value: 0.0 },
      uUseColor: { value: false },
    };
    const cardBackGeometry = new THREE.PlaneGeometry(
      width / cardRatio,
      cardRatio * width,
      subdivision,
      subdivision
    );
    const cardBackMaterial = new THREE.ShaderMaterial({
      vertexShader: flipVertexShader,
      fragmentShader: flipFragmentShader,
      uniforms: this.uniformsBack,
    });
    const cardBackMesh = new THREE.Mesh(cardBackGeometry, cardBackMaterial);
    this.add(cardBackMesh);

    this.uniformsFront = {
      uColor: { value: new THREE.Color(0xFFFFFF) },
      uRotate: { value: 0.0 },
      uTexture: { value: this.textureLoader.load(cardFrontTexturePath) },
      uTiltX: { value: 0.0 },
      uUseColor: { value: false },
    };
    const cardFrontGeometry = new THREE.PlaneGeometry(
      width / cardRatio,
      cardRatio * width,
      subdivision,
      subdivision
    );
    const cardFrontMaterial = new THREE.ShaderMaterial({
      vertexShader: flipVertexShader,
      fragmentShader: flipFragmentShader,
      uniforms: this.uniformsFront,
    });
    const cardFrontMesh = new THREE.Mesh(cardFrontGeometry, cardFrontMaterial);
    this.add(cardFrontMesh);

    const testResolutionFactor = 2.0;
    const { texture: labelTexture } = gen2DTextTexture(this.labelValue, (width / cardRatio) * testResolutionFactor, (cardRatio * width) * testResolutionFactor, 32 * testResolutionFactor, "Helvetica", "bold");
    this.uniformsLabel = {
      uColor: { value: new THREE.Color(0x708750) },
      uRotate: { value: 0.0 },
      uTexture: { value: labelTexture },
      uTiltX: { value: 0.0 },
      uUseColor: { value: true },
    };
    const depth = 0.01;
    const labelMaterial = new THREE.ShaderMaterial({
      vertexShader: flipVertexShader,
      fragmentShader: flipFragmentShader,
      uniforms: this.uniformsLabel,
      transparent: true,
      opacity: 0.5,
    });

    const labelGeometry = new THREE.PlaneGeometry(
      width / cardRatio,
      cardRatio * width,
      subdivision,
      subdivision
    );
    const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
    labelMesh.position.z = depth;
    labelMesh.scale.set(1 / testResolutionFactor, 1 / testResolutionFactor, 1 / testResolutionFactor);
    this.labelMesh = labelMesh;
    this.add(labelMesh);


    const { texture: titleTexture } = gen2DTextTexture("STRIKE", (width / cardRatio) * testResolutionFactor, (cardRatio * width) * testResolutionFactor, 12 * testResolutionFactor, "Helvetica", "bold", 1.0);
    this.uniformsTitle = {
      uColor: { value: new THREE.Color(0xFFFFFF) },
      uRotate: { value: 0.0 },
      uTexture: { value: titleTexture },
      uTiltX: { value: 0.0 },
      uUseColor: { value: true },
    };
    const titleMaterial = new THREE.ShaderMaterial({
      vertexShader: flipVertexShader,
      fragmentShader: flipFragmentShader,
      uniforms: this.uniformsTitle,
      transparent: true,
      opacity: 0.5,
    });

    const titleGeometry = new THREE.PlaneGeometry(
      width / cardRatio,
      cardRatio * width,
      subdivision,
      subdivision
    );
    const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
    titleMesh.position.z = depth * 2.0;
    titleMesh.position.y = 40.0;
    titleMesh.position.x = 13.0;
    titleMesh.scale.set(1 / testResolutionFactor, 1 / testResolutionFactor, 1 / testResolutionFactor);
    this.titleMesh = titleMesh;
    this.add(titleMesh);


    const { texture: descriptionTexture } = gen2DTextTexture(`Follow the rules to play this card!`, (width / cardRatio) * 2.0, (cardRatio * width) * 2.0, 20 / testResolutionFactor, "Helvetica", "bold", 1.0);
    this.uniformsDescription = {
      uColor: { value: new THREE.Color(0x708750) },
      uRotate: { value: 0.0 },
      uTexture: { value: descriptionTexture },
      uTiltX: { value: 0.0 },
      uUseColor: { value: true },
    };
    const descriptionMaterial = new THREE.ShaderMaterial({
      vertexShader: flipVertexShader,
      fragmentShader: flipFragmentShader,
      uniforms: this.uniformsDescription,
      transparent: true,
      opacity: 0.5,
    });

    const descriptionGeometry = new THREE.PlaneGeometry(
      width / cardRatio,
      cardRatio * width,
      subdivision,
      subdivision
    );
    const descriptionMesh = new THREE.Mesh(descriptionGeometry, descriptionMaterial);
    descriptionMesh.position.z = depth * 2.0;
    descriptionMesh.scale.set(0.5, 0.5, 0.5);
    descriptionMesh.position.y = -35.0;
    descriptionMesh.position.x = 11.0;
    this.add(descriptionMesh);

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
      this.inputManager.init();
    });

    this.addEventListener("removed", () => {
      this.inputManager.destroy();
    });
  }

  flip(action: { isHitTestSuccess: boolean }) {
    const duration = 0.25;
    const tiltX = 0.5;
    const tiltXOffset = 0.50;

    if (!this.isFaceUp) {
      const tweenRotateBack = this.root.tweenTo(this.uniformsBack.uRotate, duration * 0.5, { value: Math.PI * 1.5 }, AllGSAP.Linear.easeNone, ":playhead");
      const tweenFrontFold = this.root.tweenTo(this.uniformsFront.uTiltX, duration * 0.5, { startAt: { value: 0 }, value: tiltX }, AllGSAP.Linear.easeNone, tweenRotateBack.labelStart);
      const tweenLabelFold = this.root.tweenTo(this.uniformsLabel.uTiltX, duration * 0.5, { startAt: { value: 0 }, value: tiltX }, AllGSAP.Linear.easeNone, tweenRotateBack.labelStart);
      const tweenTitleFold = this.root.tweenTo(this.uniformsTitle.uTiltX, duration * 0.5, { startAt: { value: 0 }, value: tiltX + tiltXOffset }, AllGSAP.Linear.easeNone, tweenRotateBack.labelStart);
      const tweenDescriptionFold = this.root.tweenTo(this.uniformsDescription.uTiltX, duration * 0.5, { startAt: { value: 0 }, value: tiltX + tiltXOffset }, AllGSAP.Linear.easeNone, tweenRotateBack.labelStart);
      const tweenBackFold = this.root.tweenTo(this.uniformsBack.uTiltX, duration * 0.5, { startAt: { value: 0 }, value: -tiltX }, AllGSAP.Linear.easeNone, tweenRotateBack.labelStart);

      const tweenRotateWhole = this.root.tweenTo(this.rotation, duration * 0.5, {
        y: -Math.PI,
      }, AllGSAP.Linear.easeNone, tweenRotateBack.labelEnd);

      const tweenRotateBackReverse = this.root.tweenTo(this.uniformsBack.uRotate, duration * 0.5, { value: Math.PI * 1.0 }, AllGSAP.Linear.easeNone, tweenRotateWhole.labelStart);
      const tweenFrontFoldReverse = this.root.tweenTo(this.uniformsFront.uTiltX, duration * 0.5, { value: 0 }, AllGSAP.Linear.easeNone, tweenRotateWhole.labelStart);
      const tweenLabelFoldReverse = this.root.tweenTo(this.uniformsLabel.uTiltX, duration * 0.5, { value: 0 }, AllGSAP.Linear.easeNone, tweenRotateWhole.labelStart);
      const tweenTitleFoldReverse = this.root.tweenTo(this.uniformsTitle.uTiltX, duration * 0.5, { value: 0 }, AllGSAP.Linear.easeNone, tweenRotateWhole.labelStart);
      const tweenDescriptionFoldReverse = this.root.tweenTo(this.uniformsDescription.uTiltX, duration * 0.5, { value: 0 }, AllGSAP.Linear.easeNone, tweenRotateWhole.labelStart);
      const tweenBackFoldReverse = this.root.tweenTo(this.uniformsBack.uTiltX, duration * 0.5, { value: 0 }, AllGSAP.Linear.easeNone, tweenRotateWhole.labelStart);
    } else {
      const tweenRotateFront = this.root.tweenTo(this.uniformsFront.uRotate, duration * 0.5, { value: Math.PI * 0.5 }, AllGSAP.Linear.easeNone, ":playhead");
      const tweenFrontFold = this.root.tweenTo(this.uniformsFront.uTiltX, duration * 0.5, { startAt: { value: 0 }, value: -tiltX }, AllGSAP.Linear.easeNone, tweenRotateFront.labelStart);
      const tweenLabelFold = this.root.tweenTo(this.uniformsLabel.uTiltX, duration * 0.5, { startAt: { value: 0 }, value: -tiltX }, AllGSAP.Linear.easeNone, tweenRotateFront.labelStart);
      const tweenTitleFold = this.root.tweenTo(this.uniformsTitle.uTiltX, duration * 0.5, { startAt: { value: 0 }, value: -tiltX }, AllGSAP.Linear.easeNone, tweenRotateFront.labelStart);
      const tweenDescriptionFold = this.root.tweenTo(this.uniformsDescription.uTiltX, duration * 0.5, { startAt: { value: 0 }, value: -tiltX }, AllGSAP.Linear.easeNone, tweenRotateFront.labelStart);
      const tweenBackFold = this.root.tweenTo(this.uniformsBack.uTiltX, duration * 0.5, { startAt: { value: 0 }, value: tiltX }, AllGSAP.Linear.easeNone, tweenRotateFront.labelStart);

      const tweenRotateWhole = this.root.tweenTo(this.rotation, duration * 0.5, {
        y: -Math.PI * 2.0,
      }, AllGSAP.Linear.easeNone, tweenRotateFront.labelEnd);

      const tweenRotateFrontReverse = this.root.tweenTo(this.uniformsFront.uRotate, duration * 0.5, { value: Math.PI * 0.0 }, AllGSAP.Linear.easeNone, tweenRotateWhole.labelStart);
      const tweenFrontFoldReverse = this.root.tweenTo(this.uniformsFront.uTiltX, duration * 0.5, { value: 0 }, AllGSAP.Linear.easeNone, tweenRotateWhole.labelStart);
      const tweenLabelFoldReverse = this.root.tweenTo(this.uniformsLabel.uTiltX, duration * 0.5, { value: 0 }, AllGSAP.Linear.easeNone, tweenRotateWhole.labelStart);
      const tweenBackFoldReverse = this.root.tweenTo(this.uniformsBack.uTiltX, duration * 0.5, { value: 0 }, AllGSAP.Linear.easeNone, tweenRotateWhole.labelStart);
      const tweenTitleFoldReverse = this.root.tweenTo(this.uniformsTitle.uTiltX, duration * 0.5, { value: 0 }, AllGSAP.Linear.easeNone, tweenRotateWhole.labelStart);
      const tweenDescriptionFoldReverse = this.root.tweenTo(this.uniformsDescription.uTiltX, duration * 0.5, { value: 0 }, AllGSAP.Linear.easeNone, tweenRotateWhole.labelStart);
      const tweenRotateWholeReverseReset = this.root.tweenTo(this.rotation, 0.01, {
        y: 0,
      }, AllGSAP.Linear.easeNone, ">");
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
