import * as THREE from "three";

export class CustomObject3D extends THREE.Object3D {
  constructor() {
    super();
  }

  get boundingBox() {
    const boundingBox = new THREE.Box3().setFromObject(this);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    return size;
  }
}
