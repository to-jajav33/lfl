import Main from "./main/Main";
import * as THREE from "three";
import { Card } from "./main/components/Card";

export const main = new Main(
  document.getElementById("canvas-container") as HTMLElement,
  { addHelpers: true }
);

// create a plane to place the cards on
const plane = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 });
const planeMesh = new THREE.Mesh(plane, planeMaterial);
planeMesh.rotateX(-Math.PI / 2);
main.scene.add(planeMesh);

const card = new Card();
card.rotateX(-Math.PI * 0.5);
card.position.y = card.boundingBox.y * 0.5;
main.scene.add(card);
