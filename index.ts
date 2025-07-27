import Main from "./main/Main";

export const main = new Main(
  document.getElementById("canvas-container") as HTMLElement,
  { addHelpers: true }
);
