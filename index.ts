if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // Handle the update, e.g., update local state with newModule.someValue
    console.log("my-module updated!", newModule.someValue);
  });
}
import Main from "./main/Main";
import * as THREE from "three";
import { Card } from "./main/components/Card";
import { GridPositioning } from "./main/components/GridPositioning";

export const main = new Main(
  document.getElementById("canvas-container") as HTMLElement,
  { addHelpers: true }
);

// create a plane to place the cards on
const plane = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 });
const planeMesh = new THREE.Mesh(plane, planeMaterial);
main.scene.add(planeMesh);

const cards = [];
for (let i = 0; i < 10; i++) {
  const card = new Card(main);
  card.position.z = Number((card.boundingBox.z * 0.5).toFixed(5));
  cards.push(card);
  main.scene.add(card);
}

const grid = new GridPositioning(main, cards);
grid.position.z = cards[0]?.position.z ?? 0;
grid.fanOut("x", 0.1);
main.scene.add(grid);
