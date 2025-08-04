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
import { InputManager, type Action } from "./main/libs/InputManager";
import * as AllGSAP from "gsap";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

const container = document.getElementById("canvas-container") as HTMLElement;
export const main = new Main(
  container,
  { addHelpers: false, cameraType: "orthographic" }
);

const gui = new GUI();
gui.add(main, "showHelpers").name(`Show Helpers (h)
Left MB: Drag to rotate camera
Right MB: Drag to move camera
Shift + Left MB: Drag to pan camera
Scroll Wheel: Zoom camera
Space: Reset camera
`);

const mainInputManager = new InputManager(main.renderer.domElement, {
  "toggleHelpers": {
    "keyup": (event: KeyboardEvent, action: Action) => {
      if (event.key === "h") {
        main.showHelpers = !main.showHelpers;
      }
      // if space key is pressed
      else if (event.key === " ") {
        main.camera.position.set(0, 0, 500);
        main.camera.lookAt(0, 0, 0);
      }
    }
  }
});
mainInputManager.init();

main.camera.position.set(0, 0, 500);
main.camera.lookAt(0, 0, 0);

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
  card.position.z = Number(Math.max(card.boundingBox.x * 0.5, 1.0).toFixed(5));
  cards.push(card);
  main.scene.add(card);
}

const grid = new GridPositioning(main, cards);
grid.position.z = cards[0]?.position.z ?? 0;
const maxCardsPerRow = 5;
const startPositions = grid.fanOut("x", cardWidth * 0.1, "y", maxCardsPerRow);
grid.add(...cards);
grid.position.x = planeMesh.position.x - grid.boundingBox.x * 0.5 + (cards[0]?.boundingBox.x ?? 0) * 0.5;
main.scene.add(grid);
let lastTimeline: any;
cards.forEach(card => {
  card.inputManager.eventEmitter.on("dragMove", (action: Action) => {
    if (lastTimeline?.whenComplete?.status === "pending") return;

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
      z: grid.position.z + 2.0
    }, AllGSAP.Linear.easeNone, ":playhead");

    // now use the local card position to find the closest card
    const closestStartPosition = startPositions
      .filter((_c, i) => i !== card.cardId)
      .sort((a, b) => {
        // get the distance between the mouse and the start position using x and y coordinates
        const distA = Math.sqrt(Math.pow(mouseGlobalPosition.x - a.x, 2) + Math.pow(mouseGlobalPosition.y - a.y, 2));
        const distB = Math.sqrt(Math.pow(mouseGlobalPosition.x - b.x, 2) + Math.pow(mouseGlobalPosition.y - b.y, 2));
        return distA - distB;
      })[0];
    if (!closestStartPosition) return;

    const diff = mouseGlobalPosition.x - closestStartPosition.x;
    if (Math.abs(diff) > cardWidth * 0.5) return;

    const closestCard = cards[startPositions.indexOf(closestStartPosition)];
    if (!closestCard) return;

    const iDiff = closestCard.cardId - card.cardId;
    const origId = card.cardId;
    for (let i = 0; i < Math.abs(iDiff); i++) {
      const nextCardId = origId + ((i + 1) * Math.sign(iDiff));
      const nextCard = cards[nextCardId];
      if (!nextCard) continue;

      const tempId = card.cardId;
      card.cardId = nextCard.cardId;
      nextCard.cardId = tempId;

      const nextNewPosition = startPositions[nextCard.cardId];
      if (!nextNewPosition) continue;
      lastTimeline = main.tweenTo(nextCard.position, 0.2, {
        x: nextNewPosition.x,
        y: nextNewPosition.y,
      }, AllGSAP.Linear.easeIn, ":playhead");
    }

    cards.splice(origId, 1);
    cards.splice(card.cardId, 0, card);
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
