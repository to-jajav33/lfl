import * as THREE from "three";
import { CustomObject3D } from "./CustomObject3D";
import { Main } from "../Main";

export class GridPositioning extends CustomObject3D {
  private objects: CustomObject3D[];

  constructor(root: Main, objects: CustomObject3D[]) {
    super(root);

    this.objects = objects;
  }

  fanOut(direction: "x" | "y" | "z", gap: number, columnDirection: "x" | "y" | "z", maxCardsPerRow: number): THREE.Vector3[] {
    const startPositions: THREE.Vector3[] = [];
    // use my global position to calculate the position of the objects
    const thisGlobal = this.localToWorld(this.position.clone());
    let lastPosition = thisGlobal.clone();
    this.objects.forEach((object, index) => {
      const globalClone = thisGlobal.clone();
      // worldToLocal is passed by reference, so we need to clone the vector
      const localPos = this.worldToLocal(globalClone);
      localPos[direction] = lastPosition[direction];
      localPos[columnDirection] = lastPosition[columnDirection];
      startPositions.push(globalClone);
      object.position.set(localPos.x, localPos.y, localPos.z);
      const objBoundingBox = this.getOtherBoundingBox(object);
      const spacing = objBoundingBox[direction];
      lastPosition = lastPosition.clone();
      lastPosition[direction] += spacing + gap;
      if ((index > 0) && (((index + 1) % maxCardsPerRow) === 0)) {
        const columnIndex = Math.floor((index + 1) / maxCardsPerRow);
        lastPosition = thisGlobal.clone();
        const currLastPositionColumnDirection = lastPosition[columnDirection];
        lastPosition[columnDirection] = currLastPositionColumnDirection - (objBoundingBox[columnDirection] + gap) * columnIndex;
      }
    });
    return startPositions;
  }
}
