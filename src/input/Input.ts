import * as THREE from "three";

import InputConfig from "./InputConfig";

export default class Input {
  private readonly keys = new Set<string>();
  constructor() {
    this.addEventListeners();
  }
  private addEventListeners(): void {
    window.addEventListener("keydown", this.keyDown);
    window.addEventListener("keyup", this.keyUp);
  }
  private keyDown = (event: KeyboardEvent): void => {
    this.keys.add(event.code);
  };
  private keyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };
  public getDirection(): THREE.Vector2 {
    const direction = new THREE.Vector2();

    if (this.keys.has(InputConfig.movement.forward)) direction.y += 1;
    if (this.keys.has(InputConfig.movement.backward)) direction.y -= 1;
    if (this.keys.has(InputConfig.movement.left)) direction.x -= 1;
    if (this.keys.has(InputConfig.movement.right)) direction.x += 1;

    const length = Math.hypot(direction.x, direction.y);
    if (length > 0) {
      direction.x /= length;
      direction.y /= length;
    }

    return direction;
  }
}
