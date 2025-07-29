import * as THREE from "three";
import { CustomObject3D } from "./CustomObject3D";
import { Main } from "../Main";
import { InputManager } from "../libs/InputManager";

export class Card extends CustomObject3D {
  inputManager: InputManager;

  constructor(root: Main) {
    super(root);

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
          click: (event, action) => {
            if (action.isHitTestSuccess) {
              console.log("selected");
            }
          },
        },
      },
      this.root.camera,
      this
    );
  }
}
