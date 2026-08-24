import * as THREE from "three";

import GameConfig from "../config/GameConfig";
import CharacterConfig from "./CharacterConfig";

export default class CharacterMotor {
  private grounded = false;
  private verticalVelocity = 0;
  private horizontalVelocity = new THREE.Vector3();
  private updateGravity(delta: number): void {
    if (this.grounded && this.verticalVelocity < 0) this.verticalVelocity = 0;
    this.verticalVelocity += GameConfig.physics.gravity.y * delta;
  }
  private updateHorizontalVelocity(
    direction: THREE.Vector3,
    delta: number,
  ): void {
    const targetVelocity = direction
      .clone()
      .multiplyScalar(CharacterConfig.movement.speed);

    const acceleration = CharacterConfig.movement.acceleration;
    const deceleration = CharacterConfig.movement.deceleration;
    const rate = direction.lengthSq() > 0 ? acceleration : deceleration;

    this.horizontalVelocity.lerp(targetVelocity, 1 - Math.exp(-rate * delta));
  }
  private getMovement(delta: number): THREE.Vector3 {
    return new THREE.Vector3(
      this.horizontalVelocity.x * delta,
      this.verticalVelocity * delta,
      this.horizontalVelocity.z * delta,
    );
  }
  public fixedUpdate(direction: THREE.Vector3, delta: number): THREE.Vector3 {
    this.updateGravity(delta);
    this.updateHorizontalVelocity(direction, delta);

    return this.getMovement(delta);
  }
  public setGrounded(value: boolean): void {
    this.grounded = value;
  }
}
