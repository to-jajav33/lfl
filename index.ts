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

const container = document.getElementById("canvas-container") as HTMLElement;
export const main = new Main(
  container,
  { addHelpers: false }
);

const width = 1024;
const height = 1024;

// create a plane to place the cards on
const planeGeometry = new THREE.PlaneGeometry(width, height);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 });
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
main.scene.add(planeMesh);

const NUMBER_OF_CARDS = 10;
const cardWidth = width / NUMBER_OF_CARDS;
const cards = [] as Card[];
for (let i = 0; i < NUMBER_OF_CARDS; i++) {
  const card = new Card(main, String(i + 1).trim(), cardWidth);
  card.cardId = i;
  card.position.z = Number((card.boundingBox.z * 0.5).toFixed(5));
  cards.push(card);
  main.scene.add(card);
}

const grid = new GridPositioning(main, cards);
grid.position.z = cards[0]?.position.z ?? 0;
const startPositions = grid.fanOut("x", cardWidth * 0.1);
grid.add(...cards);
grid.position.x = planeMesh.position.x - grid.boundingBox.x * 0.5 + (cards[0]?.boundingBox.x ?? 0) * 0.5;
main.scene.add(grid);
cards.forEach(card => {
  card.inputManager.eventEmitter.on("dragMove", (action: Action) => {
    let nextNewPosition;
    // use raycast against the plane to get mouse global position
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(action.mouseInfo.screenPosition, main.camera);
    const intersects = raycaster.intersectObject(planeMesh);
    if (!intersects.length || !intersects[0]) return;
    const mouseGlobalPosition = intersects[0].point.clone();
    if (!card.parent) return;
    const cardLocalPosition = card.parent.worldToLocal(mouseGlobalPosition);

    main.tweenTo(card.position, 0.2, {
      x: cardLocalPosition.x,
      y: cardLocalPosition.y,
      z: 2.0
    }, AllGSAP.Linear.easeNone, ":playhead");

    // now use the local card position to find the closest card
    const closestCard = cards.filter(c => c !== card).sort((a, b) => Math.abs(cardLocalPosition.x - a.position.x) - Math.abs(cardLocalPosition.x - b.position.x))[0];
    if (!closestCard) return;

    const diff = cardLocalPosition.x - closestCard.position.x;
    if (Math.abs(diff) > 20) return;

    const origId = card.cardId;
    card.cardId = closestCard.cardId;
    closestCard.cardId = origId;
    console.log("swapped cards: ", card.cardId, closestCard.cardId);

    nextNewPosition = startPositions[closestCard?.cardId];
    if (!nextNewPosition) return;

    cards.splice(origId, 1);
    cards.splice(card.cardId, 0, card);

    main.tweenTo(closestCard.position, 0.2, {
      x: nextNewPosition.x
    }, AllGSAP.Linear.easeIn, ":playhead");
  });
  card.inputManager.eventEmitter.on("dragEnd", () => {
    const startPosition = startPositions[card.cardId];
    if (!startPosition) return;
    main.tweenTo(card.position, 0.2, {
      x: startPosition.x,
      y: startPosition.y,
      z: grid.position.z
    }, AllGSAP.Linear.easeIn, ":playhead");
  })
});
