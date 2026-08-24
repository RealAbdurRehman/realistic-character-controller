import * as THREE from "three";

import Camera from "./Camera";

import GameConfig from "../config/GameConfig";

export default class CameraController {
  private readonly camera: Camera;

  private yaw = 0;
  private pitch = 0;
  constructor(camera: Camera) {
    this.camera = camera;
    this.addEventListeners();
  }
  private addEventListeners(): void {
    document.addEventListener("mousemove", this.mouseMove);
  }
  private mouseMove = (event: MouseEvent): void => {
    if (document.pointerLockElement !== document.body) return;

    const sensitivity = GameConfig.camera.sensitivity;
    this.yaw -= event.movementX * sensitivity;
    this.pitch -= event.movementY * sensitivity;

    this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI / 3, Math.PI / 3);
  };
  private follow(target: THREE.Vector3): void {
    const x = Math.sin(this.yaw) * Math.cos(this.pitch);
    const y = Math.sin(this.pitch);
    const z = Math.cos(this.yaw) * Math.cos(this.pitch);

    const distance = GameConfig.camera.distance;
    const height = GameConfig.camera.height;
    this.camera.instance.position.set(
      target.x + x * distance,
      target.y + height + y * distance,
      target.z + z * distance,
    );

    this.camera.instance.lookAt(target.x, target.y + 1, target.z);
  }
  public update(target: THREE.Vector3): void {
    this.follow(target);
  }
  public getForwardDirection(): THREE.Vector3 {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }
  public getMovementDirection(input: THREE.Vector2): THREE.Vector3 {
    const forward = this.getForwardDirection();
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    return new THREE.Vector3()
      .addScaledVector(forward, input.y)
      .addScaledVector(right, input.x)
      .normalize();
  }
}
