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
import type { Action } from "./main/libs/InputManager";
import * as AllGSAP from "gsap";

export const main = new Main(
  document.getElementById("canvas-container") as HTMLElement,
  { addHelpers: false }
);

// create a plane to place the cards on
const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 });
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
main.scene.add(planeMesh);

const cards = [] as Card[];
for (let i = 0; i < 10; i++) {
  const card = new Card(main, String(i + 1));
  card.cardId = i;
  card.position.z = Number((card.boundingBox.z * 0.5).toFixed(5));
  cards.push(card);
  main.scene.add(card);
}

const grid = new GridPositioning(main, cards);
grid.position.z = cards[0]?.position.z ?? 0;
const startPositions = grid.fanOut("x", 0.1);
grid.add(...cards);
grid.position.x = planeMesh.position.x - grid.boundingBox.x * 0.5 + (cards[0]?.boundingBox.x ?? 0) * 0.5;
main.scene.add(grid);
let lastMovementX;
cards.forEach(card => {
  card.inputManager.eventEmitter.on("dragMove", (action: Action) => {
    let nextCard, nextNewPosition;
    lastMovementX ??= action.mouseInfo.movementX;
    const diff = action.mouseInfo.movementX - lastMovementX;
    const origId = card.cardId;
    if (diff > 0.1) {
      card.cardId = Math.min(cards.length - 1, card.cardId + 1);
      nextCard = cards[origId + 1];
      if (!nextCard) return;
      nextCard.cardId -= 1;
      lastMovementX = action.mouseInfo.movementX;
    } else if (diff < -0.1) {
      card.cardId = Math.max(0, card.cardId - 1);
      nextCard = cards[origId - 1];
      if (!nextCard) return;
      nextCard.cardId += 1;
      lastMovementX = action.mouseInfo.movementX;
    }

    if (!nextCard) return;
    nextNewPosition = startPositions[nextCard?.cardId];
    if (!nextNewPosition) return;

    cards.splice(origId, 1);
    cards.splice(card.cardId, 0, card);

    main.tweenTo(nextCard.position, 0.2, {
      x: nextNewPosition.x
    }, AllGSAP.Linear.easeIn, ":playhead");

    main.tweenTo(card.position, 0.2, {
      x: startPositions[card.cardId]?.x ?? card.position.x,
      z: 2.0
    }, AllGSAP.Linear.easeNone, ":playhead");
  });
  card.inputManager.eventEmitter.on("dragEnd", () => {
    main.tweenTo(card.position, 0.2, {
      z: grid.position.z
    }, AllGSAP.Linear.easeIn, ":playhead");
  })
});
