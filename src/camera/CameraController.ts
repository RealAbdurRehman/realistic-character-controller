import * as THREE from "three";

import Camera from "./Camera";

export default class CameraController {
  private readonly camera: Camera;
  constructor(camera: Camera) {
    this.camera = camera;
  }
  private follow(target: THREE.Vector3): void {
    this.camera.instance.position.set(target.x, target.y + 3, target.z + 6);
    this.camera.instance.lookAt(target.x, target.y + 1, target.z);
  }
  public update(target: THREE.Vector3): void {
    this.follow(target);
  }
}
