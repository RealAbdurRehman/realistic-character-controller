import * as THREE from "three";

import Camera from "./Camera";
import GameConfig from "../config/GameConfig";

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _movementDir = new THREE.Vector3();

export default class CameraController {
  private yaw = 0;
  private pitch = 0;
  private readonly camera: Camera;
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
    return _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }
  public getMovementDirection(input: THREE.Vector2): THREE.Vector3 {
    _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    return _movementDir
      .set(0, 0, 0)
      .addScaledVector(_forward, input.y)
      .addScaledVector(_right, input.x)
      .normalize();
  }
}
