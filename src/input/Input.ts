import * as THREE from "three";

import InputConfig from "./InputConfig";
import type InputState from "./InputState";

export default class Input {
  private readonly keys = new Set<string>();
  private readonly previousKeys = new Set<string>();
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
  private isJustPressed(key: string): boolean {
    return this.keys.has(key) && !this.previousKeys.has(key);
  }
  public getInput(): InputState {
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

    return {
      direction,
      sprinting: this.keys.has(InputConfig.sprint),
      jumping: this.isJustPressed(InputConfig.jump),
    };
  }
  public update(): void {
    this.previousKeys.clear();
    for (const key of this.keys) this.previousKeys.add(key);
  }
}
