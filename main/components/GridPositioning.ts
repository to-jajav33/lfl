import * as THREE from "three";
import { CustomObject3D } from "./CustomObject3D";
import { Main } from "../Main";

export class GridPositioning extends CustomObject3D {
  private objects: CustomObject3D[];

  constructor(root: Main, objects: CustomObject3D[]) {
    super(root);

    this.objects = objects;
  }

  fanOut(direction: "x" | "y" | "z", gap: number) {
    // use my global position to calculate the position of the objects
    const thisGlobal = this.localToWorld(this.position);
    let lastPosition = thisGlobal[direction];
    this.objects.forEach((object) => {
      // worldToLocal is passed by reference, so we need to clone the vector
      const localPos = object.worldToLocal(thisGlobal.clone());
      localPos[direction] = lastPosition;
      object.position.set(localPos.x, localPos.y, localPos.z);
      const spacing = object.boundingBox[direction];
      lastPosition += spacing + gap;
    });
  }
}
