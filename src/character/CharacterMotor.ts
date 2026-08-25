import * as THREE from "three";

import GameConfig from "../config/GameConfig";
import CharacterConfig from "./CharacterConfig";
import type CharacterInput from "./CharacterInput";

export default class CharacterMotor {
  private grounded = false;
  private verticalVelocity = 0;
  private horizontalVelocity = new THREE.Vector3();
  private tryJump(input: CharacterInput): void {
    if (!input.jumping || !this.grounded) return;
    this.verticalVelocity = CharacterConfig.jump.force;
  }
  private updateGravity(delta: number): void {
    if (this.grounded && this.verticalVelocity < 0) this.verticalVelocity = 0;
    this.verticalVelocity += GameConfig.physics.gravity.y * delta;
  }
  private updateHorizontalVelocity(input: CharacterInput, delta: number): void {
    const speed = input.sprinting
      ? CharacterConfig.movement.sprintSpeed
      : CharacterConfig.movement.speed;
    const targetVelocity = input.direction.clone().multiplyScalar(speed);

    const acceleration = CharacterConfig.movement.acceleration;
    const deceleration = CharacterConfig.movement.deceleration;
    const rate = input.direction.lengthSq() > 0 ? acceleration : deceleration;

    this.horizontalVelocity.lerp(targetVelocity, 1 - Math.exp(-rate * delta));
  }
  private getMovement(delta: number): THREE.Vector3 {
    return new THREE.Vector3(
      this.horizontalVelocity.x * delta,
      this.verticalVelocity * delta,
      this.horizontalVelocity.z * delta,
    );
  }
  public fixedUpdate(input: CharacterInput, delta: number): THREE.Vector3 {
    this.tryJump(input);
    this.updateGravity(delta);
    this.updateHorizontalVelocity(input, delta);

    return this.getMovement(delta);
  }
  public setGrounded(value: boolean): void {
    this.grounded = value;
  }
}
