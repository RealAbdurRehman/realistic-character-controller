import Camera from "./Camera";

import type { Vector3 } from "../types/Vector";

export default class CameraController {
  private readonly camera: Camera;
  constructor(camera: Camera) {
    this.camera = camera;
  }
  private follow(target: Vector3): void {
    this.camera.instance.position.set(target.x, target.y + 3, target.z + 6);
    this.camera.instance.lookAt(target.x, target.y + 1, target.z);
  }
  public update(target: Vector3): void {
    this.follow(target);
  }
}
