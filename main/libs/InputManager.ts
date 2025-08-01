import { EventEmitter } from "./EventEmitter";
import { Object3D, Camera, Vector2, Raycaster } from "three";

export type Action = {
  mouseScreenPosition: Vector2;
  pressedStrength: number;
  isJustPressed: boolean;
  isJustReleased: boolean;
  isHitTestSuccess: boolean;
};

interface Inputs {
  click?: (event: MouseEvent, action: Action) => any;
  mouseDown?: (event: MouseEvent, action: Action) => any;
  mouseUp?: (event: MouseEvent, action: Action) => any;
  mouseMove?: (event: MouseEvent, action: Action) => any;
  mouseWheel?: (event: WheelEvent, action: Action) => any;
  mouseEnter?: (event: MouseEvent, action: Action) => any;
  mouseLeave?: (event: MouseEvent, action: Action) => any;
  mouseOver?: (event: MouseEvent, action: Action) => any;
  mouseOut?: (event: MouseEvent, action: Action) => any;
  mouseClick?: (event: MouseEvent, action: Action) => any;
  mouseDoubleClick?: (event: MouseEvent, action: Action) => any;
  mouseTripleClick?: (event: MouseEvent, action: Action) => any;
  keyDown?: (event: KeyboardEvent, action: Action) => any;
  keyUp?: (event: KeyboardEvent, action: Action) => any;
  keyPress?: (event: KeyboardEvent, action: Action) => any;
  touchStart?: (event: TouchEvent, action: Action) => any;
  touchEnd?: (event: TouchEvent, action: Action) => any;
  touchMove?: (event: TouchEvent, action: Action) => any;
  touchCancel?: (event: TouchEvent, action: Action) => any;
  wheel?: (event: WheelEvent, action: Action) => any;
  resize?: (event: Event, action: Action) => any;
  scroll?: (event: Event, action: Action) => any;
  focus?: (event: Event, action: Action) => any;
  blur?: (event: Event, action: Action) => any;
  contextmenu?: (event: Event, action: Action) => any;
  ":drag"?: (event: DragEvent, action: Action) => any;
  ":dragend"?: (event: DragEvent, action: Action) => any;
  ":dragenter"?: (event: DragEvent, action: Action) => any;
  ":dragleave"?: (event: DragEvent, action: Action) => any;
  ":dragover"?: (event: DragEvent, action: Action) => any;
  ":dragexit"?: (event: DragEvent, action: Action) => any;
  ":hoverIn"?: (event: PointerEvent, action: Action) => any;
  ":hoverOut"?: (event: PointerEvent, action: Action) => any;
  pointerdown?: (event: PointerEvent, action: Action) => any;
  pointerup?: (event: PointerEvent, action: Action) => any;
  pointermove?: (event: PointerEvent, action: Action) => any;
  pointercancel?: (event: PointerEvent, action: Action) => any;
  pointerover?: (event: PointerEvent, action: Action) => any;
  pointerenter?: (event: PointerEvent, action: Action) => any;
  pointerleave?: (event: PointerEvent, action: Action) => any;
}
type ActionDefs = Record<string, Inputs>;

export class InputManager {
  private canvas: HTMLCanvasElement;
  private actionDefs: ActionDefs;
  private actions: Record<string, Action> = {};
  public eventEmitter: EventEmitter;
  private lastMouseScreenPosition: Vector2;
  private hitTestObjects: { camera?: Camera; object?: Object3D };
  private lastHitTestSuccess: boolean = false;
  private listenersCreated: Record<
    string,
    { listener: (event: Event) => void; inputName: string }
  > = {};
  private indexedByInputEvent: Record<string, Record<string, { configFn: (event: Event, action: Action) => any; actionName: string }>> = {};

  constructor(
    canvas: HTMLCanvasElement,
    actionDefs: ActionDefs,
    camera?: Camera,
    object?: Object3D
  ) {
    this.handleInput = this.handleInput.bind(this);

    this.indexedByInputEvent = {};
    this.canvas = canvas;
    this.hitTestObjects = {
      camera,
      object,
    };
    this.actionDefs = actionDefs;
    this.eventEmitter = new EventEmitter();
    this.lastMouseScreenPosition = new Vector2();

    this.init();
  }

  destroy() {
    this.eventEmitter.destroy();
    // remove all canvas event listeners
    for (const listener of Object.values(this.listenersCreated)) {
      this.canvas.removeEventListener(listener.inputName, listener.listener);
    }
  }

  private init() {
    // optimize by indexing the input names
    for (const [actionName, inputs] of Object.entries(this.actionDefs)) {
      for (const [_inputName, configFn] of Object.entries(inputs)) {
        this.indexedByInputEvent[_inputName] ??= {};
        this.indexedByInputEvent[_inputName][actionName] = {
          configFn,
          actionName,
        };
        console.log("indexed: ", _inputName, ": ", actionName);

        let convertedInputName = _inputName;
        if (_inputName.startsWith(":")) {
          convertedInputName = "pointermove";
          console.log("converted: ", convertedInputName, "from: ", _inputName);
        }

        if (!this.listenersCreated[convertedInputName]) {
          this.canvas.addEventListener(convertedInputName, this.handleInput);
          this.listenersCreated[convertedInputName] = {
            listener: this.handleInput,
            inputName: convertedInputName,
          };
        }
      }
    }
  }

  handleInput(event: Event) {
    // @todo debounce the mouse events to optimize performance
    if (
      event instanceof MouseEvent ||
      event instanceof PointerEvent ||
      event instanceof TouchEvent
    ) {
      const rect = this.canvas.getBoundingClientRect();
      const clientX =
        event instanceof MouseEvent || event instanceof PointerEvent
          ? event.clientX
          : event.touches[0]?.clientX;
      const clientY =
        event instanceof MouseEvent || event instanceof PointerEvent
          ? event.clientY
          : event.touches[0]?.clientY;
      this.lastMouseScreenPosition = new Vector2(
        ((clientX ?? 0 - rect.left) / this.canvas.offsetWidth) * 2 - 1,
        (-(clientY ?? 0 - rect.top) / this.canvas.offsetHeight) * 2 + 1
      );

      const wasHitTestSuccess = this.lastHitTestSuccess;

      if (this.hitTestObjects.camera && this.hitTestObjects.object) {
        const raycaster = new Raycaster();
        raycaster.setFromCamera(
          this.lastMouseScreenPosition,
          this.hitTestObjects.camera
        );
        const intersects = raycaster.intersectObject(
          this.hitTestObjects.object
        );
        this.lastHitTestSuccess = intersects.length > 0;
      }

      // then emit the action
      if (wasHitTestSuccess !== this.lastHitTestSuccess) {
        const hoverInputName = this.lastHitTestSuccess ? ":hoverOut" : ":hoverIn";
        const actionsToEmit = this.indexedByInputEvent[hoverInputName];
        for (const [actionName, { configFn }] of Object.entries(actionsToEmit ?? {})) {
          const shouldEmit = configFn ? configFn(event as any, this.actions[actionName] as Action) : true;
          if (shouldEmit) {
            console.log("emitting: ", actionName);
            this.eventEmitter.emit(actionName, this.actions[actionName]);
          }
        }
      }
    }

    const inputName = event.type as keyof Inputs;
    let actions = this.indexedByInputEvent[inputName];
    if (inputName.endsWith("move")) {
      actions = {
        ...actions
      }
    }
    if (!actions) return;

    for (const [actionName, { configFn }] of Object.entries(actions ?? {})) {
      if (!this.actions[actionName]) {
        this.actions[actionName] = {
          mouseScreenPosition: new Vector2(),
          pressedStrength: 0,
          isJustPressed: false,
          isJustReleased: false,
          isHitTestSuccess: false
        };
      }

      // update the mouse screen position, event for non mouse events
      // this way user can say when key pressed, AND mouse is over the object, etc.
      this.actions[actionName].mouseScreenPosition =
        this.lastMouseScreenPosition;
      this.actions[actionName].isHitTestSuccess = this.lastHitTestSuccess;

      // now let the user update any input data
      let shouldEmit = true;
      if (configFn) {
        shouldEmit = configFn(event as any, this.actions[actionName] as Action);
      }

      if (shouldEmit) {
        console.log("emitting: ", actionName);
        this.eventEmitter.emit(actionName, this.actions[actionName]);
      }
    }

  };
}
