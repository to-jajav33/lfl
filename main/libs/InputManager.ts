import { EventEmitter } from "./EventEmitter";

type Inputs = {
    "mouseDown": (event: MouseEvent) => any,
    "mouseUp": (event: MouseEvent) => any,
    "mouseMove": (event: MouseEvent) => any,
    "mouseWheel": (event: WheelEvent) => any,
    "mouseEnter": (event: MouseEvent) => any,
    "mouseLeave": (event: MouseEvent) => any,
    "mouseOver": (event: MouseEvent) => any,
    "mouseOut": (event: MouseEvent) => any,
    "mouseClick": (event: MouseEvent) => any,
    "mouseDoubleClick": (event: MouseEvent) => any,
    "mouseTripleClick": (event: MouseEvent) => any,
    "keyDown": (event: KeyboardEvent) => any,
    "keyUp": (event: KeyboardEvent) => any,
    "keyPress": (event: KeyboardEvent) => any,
    "touchStart": (event: TouchEvent) => any,
    "touchEnd": (event: TouchEvent) => any,
    "touchMove": (event: TouchEvent) => any,
    "touchCancel": (event: TouchEvent) => any,
    "wheel": (event: WheelEvent) => any,
    "resize": (event: Event) => any,
    "scroll": (event: Event) => any,
    "focus": (event: Event) => any,
    "blur": (event: Event) => any,
    "contextmenu": (event: Event) => any,
    "drop": (event: Event) => any,
    "drag": (event: DragEvent) => any,
    "dragend": (event: DragEvent) => any,
    "dragenter": (event: DragEvent) => any,
    "dragleave": (event: DragEvent) => any,
    "dragover": (event: DragEvent) => any,
    "dragexit": (event: DragEvent) => any,
    "pointerdown": (event: PointerEvent) => any,
    "pointerup": (event: PointerEvent) => any,
    "pointermove": (event: PointerEvent) => any,
    "pointercancel": (event: PointerEvent) => any,
    "pointerover": (event: PointerEvent) => any,
    "pointerenter": (event: PointerEvent) => any,
    "pointerleave": (event: PointerEvent) => any,
};
type ActionDefs = Record<string, Inputs>;

export class InputManager {
    private canvas: HTMLCanvasElement;
    private actionDefs: ActionDefs;
    private eventEmitter: EventEmitter;
    constructor(canvas: HTMLCanvasElement, actionDefs: ActionDefs) {
        this.canvas = canvas;
        this.actionDefs = actionDefs;
        this.eventEmitter = new EventEmitter();

        this.init();
    }

    private init() {
        for (const [actionName, inputs] of Object.entries(this.actionDefs)) {
            for (const [inputName, input] of Object.entries(inputs)) {
                console.log("initialized: ", actionName, ": ", inputName);
                this.canvas.addEventListener(inputName, input.bind(this) as EventListener);
            }
        }
    }
}
