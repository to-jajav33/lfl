import * as THREE from "three";
import { Main } from "../Main";

export class CustomObject3D extends THREE.Object3D {
  root: Main;

  constructor(root: Main) {
    super();

    this.root = root;
  }

  get boundingBox() {
    return this.getOtherBoundingBox(this);
  }

  getOtherBoundingBox(other: THREE.Object3D) {
    return this.root.getOtherBoundingBox(other);
  }
}
