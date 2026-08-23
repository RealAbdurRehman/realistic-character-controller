import InputConfig from "./InputConfig";

import type { Direction } from "../types/Vector";

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
  public getDirection(): Direction {
    const direction = { x: 0, z: 0 };

    if (this.keys.has(InputConfig.movement.forward)) direction.z -= 1;
    if (this.keys.has(InputConfig.movement.backward)) direction.z += 1;
    if (this.keys.has(InputConfig.movement.left)) direction.x -= 1;
    if (this.keys.has(InputConfig.movement.right)) direction.x += 1;

    const length = Math.hypot(direction.x, direction.z);
    if (length > 0) {
      direction.x /= length;
      direction.z /= length;
    }

    return direction;
  }
}
