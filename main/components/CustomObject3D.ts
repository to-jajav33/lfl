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
    const boundingBox = new THREE.Box3().setFromObject(other);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    return size;
  }
}
