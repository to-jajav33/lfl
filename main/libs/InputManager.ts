import { EventEmitter } from "./EventEmitter";
import { Object3D, Camera, Vector2, Raycaster } from "three";

export type Action = {
  mouseInfo: {
    screenPosition: Vector2;
    isPressed: boolean;
    pressedStrength: number;
    isJustPressed: boolean;
    isJustReleased: boolean;
    isHitTestSuccess: boolean;
    isDragging: boolean;
    movementX: number;
    movementY: number;
  };
  pressedStrength: number;
  isJustPressed: boolean;
  isJustReleased: boolean;
};

interface Inputs {
  mousedown?: (event: MouseEvent, action: Action) => any;
  mouseup?: (event: MouseEvent, action: Action) => any;
  mousemove?: (event: MouseEvent, action: Action) => any;
  mousewheel?: (event: WheelEvent, action: Action) => any;
  mouseenter?: (event: MouseEvent, action: Action) => any;
  mouseleave?: (event: MouseEvent, action: Action) => any;
  mouseover?: (event: MouseEvent, action: Action) => any;
  mouseout?: (event: MouseEvent, action: Action) => any;
  keydown?: (event: KeyboardEvent, action: Action) => any;
  keyup?: (event: KeyboardEvent, action: Action) => any;
  keypress?: (event: KeyboardEvent, action: Action) => any;
  touchstart?: (event: TouchEvent, action: Action) => any;
  touchend?: (event: TouchEvent, action: Action) => any;
  touchmove?: (event: TouchEvent, action: Action) => any;
  touchcancel?: (event: TouchEvent, action: Action) => any;
  wheel?: (event: WheelEvent, action: Action) => any;
  resize?: (event: Event, action: Action) => any;
  scroll?: (event: Event, action: Action) => any;
  focus?: (event: Event, action: Action) => any;
  blur?: (event: Event, action: Action) => any;
  contextmenu?: (event: Event, action: Action) => any;
  ":click"?: (event: MouseEvent, action: Action) => any;
  ":dragStart"?: (event: DragEvent, action: Action) => any;
  ":dragMove"?: (event: DragEvent, action: Action) => any;
  ":dragEnd"?: (event: DragEvent, action: Action) => any;
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
  private mouseInfo = {
    screenPosition: new Vector2(),
    isPressed: false,
    pressedStrength: 0,
    isJustPressed: false,
    isJustReleased: false,
    isHitTestSuccess: false,
    isDragging: false,
    movementX: 0,
    movementY: 0
  };
  private hitTestObjects: { camera?: Camera; object?: Object3D };
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
  }

  destroy() {
    this.indexedByInputEvent = {};
    this.listenersCreated = {};
    this.actions = {};
    // remove all canvas event listeners
    for (const listener of Object.values(this.listenersCreated)) {
      const canvasOrDocument = listener.inputName.startsWith("key") ? document : this.canvas;
      canvasOrDocument.removeEventListener(listener.inputName, listener.listener);
    }
  }

  public init(actionDefs?: ActionDefs) {
    this.actionDefs = actionDefs ?? this.actionDefs;
    // optimize by indexing the input names
    for (const [actionName, inputs] of Object.entries(this.actionDefs)) {
      for (const [_inputName, configFn] of Object.entries(inputs)) {
        this.indexedByInputEvent[_inputName] ??= {};
        this.indexedByInputEvent[_inputName][actionName] = {
          configFn,
          actionName,
        };
        console.log("indexed: ", _inputName, ": ", actionName);

        let convertedInputNames = [_inputName];
        if (_inputName.startsWith(":")) {
          convertedInputNames = ["pointermove"];
          if (_inputName.startsWith(":drag")) {
            convertedInputNames = ["pointerdown", "pointermove", "pointerup"];
          } else if (_inputName === ":click") {
            convertedInputNames = ["pointerdown", "pointerup"];
          }
          console.log("converted: ", convertedInputNames, "from: ", _inputName);
        }

        for (const convertedInputName of convertedInputNames) {
          if (!this.listenersCreated[convertedInputName]) {
            const canvasOrDocument = convertedInputName.startsWith("key") ? document : this.canvas;
            canvasOrDocument.addEventListener(convertedInputName, this.handleInput);
            this.listenersCreated[convertedInputName] = {
              listener: this.handleInput,
              inputName: convertedInputName,
            };
          }
        }
      }
    }
  }

  handleInput(event: Event) {
    let evType = event.type;
    const wasPressed = this.mouseInfo.isPressed;
    const wasHitTestSuccess = this.mouseInfo.isHitTestSuccess;
    const wasJustPressed = this.mouseInfo.isJustPressed;
    const wasDragging = this.mouseInfo.isDragging;
    const lastScreenPosition = this.mouseInfo.screenPosition.clone();

    // @todo singleto mouse logic for performance
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
      this.mouseInfo.screenPosition.x = ((clientX ?? 0 - rect.left) / this.canvas.offsetWidth) * 2 - 1;
      this.mouseInfo.screenPosition.y = (-(clientY ?? 0 - rect.top) / this.canvas.offsetHeight) * 2 + 1;

      const movementX = this.mouseInfo.screenPosition.x - lastScreenPosition.x;
      const movementY = this.mouseInfo.screenPosition.y - lastScreenPosition.y;
      this.mouseInfo.movementX += movementX;
      this.mouseInfo.movementX += movementY;

      if (this.hitTestObjects.camera && this.hitTestObjects.object) {
        const raycaster = new Raycaster();
        raycaster.setFromCamera(
          this.mouseInfo.screenPosition,
          this.hitTestObjects.camera
        );
        const intersects = raycaster.intersectObject(
          this.hitTestObjects.object
        );
        this.mouseInfo.isHitTestSuccess = intersects.length > 0;
      }

      // update the mouse info
      this.mouseInfo.isJustPressed = false;
      this.mouseInfo.isJustReleased = false;

      let evMouseBtnType = "";
      switch (evType) {
        case "mousedown":
        case "pointerdown":
        case "touchstart":
          if (this.mouseInfo.isHitTestSuccess) {
            if (!wasPressed) {
              this.mouseInfo.isJustPressed = true;
            }
            this.mouseInfo.isPressed = true;
          }
          break;
        case "mouseup":
        case "pointerup":
        case "touchend":
          if (wasPressed) {
            this.mouseInfo.isJustReleased = true;
          }
          this.mouseInfo.isPressed = false;
          if (wasJustPressed) {
            evMouseBtnType = ":click";
          }
          break;
      }

      // handle hover events
      let evHoverType = ""
      if (wasHitTestSuccess !== this.mouseInfo.isHitTestSuccess) {
        evHoverType = this.mouseInfo.isHitTestSuccess ? ":hoverIn" : ":hoverOut";
      }

      // handle drag events
      let evDragType = "";
      if (evType.endsWith("move") && this.mouseInfo.isPressed) {
        evDragType = ":dragMove";
        this.mouseInfo.isDragging = true;
        if (!wasDragging) {
          evDragType = ":dragStart";
          this.mouseInfo.movementX = 0;
          this.mouseInfo.movementY = 0;
        }
      }

      if (!this.mouseInfo.isPressed && wasDragging) {
        evDragType = ":dragEnd";
        this.mouseInfo.isDragging = false;
        this.mouseInfo.movementX = 0;
        this.mouseInfo.movementY = 0;
      }

      if (evHoverType) {
        this.handleEmitActions(evHoverType, event);
      }

      if (evDragType) {
        this.handleEmitActions(evDragType, event);
      }

      if (evMouseBtnType) {
        this.handleEmitActions(evMouseBtnType, event);
      }
    }
    this.handleEmitActions(evType, event);
  }

  getAction(actionName: string) {
    if (!this.actions[actionName]) {
      this.actions[actionName] = {
        mouseInfo: this.mouseInfo,
        pressedStrength: 0,
        isJustPressed: false,
        isJustReleased: false
      };
    }
    return this.actions[actionName];
  }

  private handleEmitActions(evType: string, event: Event) {
    const inputName = evType as keyof Inputs;
    let actions = this.indexedByInputEvent[inputName];
    if (!actions) return;

    for (const [actionName, { configFn }] of Object.entries(actions ?? {})) {
      const action = this.getAction(actionName);
      if (!action) continue;

      // now let the user update any input data
      let shouldEmit = true;
      if (configFn) {
        shouldEmit = configFn(event as any, action as Action);
      }

      if (shouldEmit) {
        // console.log("emitting: ", actionName);
        this.eventEmitter.emit(actionName, action);
      }
    }
  }
}
