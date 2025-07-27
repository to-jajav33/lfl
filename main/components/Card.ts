import * as THREE from "three";

export class Card extends THREE.Object3D {
  constructor() {
    super();

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
  }

  get boundingBox() {
    const boundingBox = new THREE.Box3().setFromObject(this);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    return size;
  }
}
