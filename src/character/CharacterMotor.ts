import * as THREE from "three";

import GameConfig from "../config/GameConfig";
import CharacterConfig from "./CharacterConfig";
import type CharacterInput from "./CharacterInput";

export default class CharacterMotor {
  private jumped = false;
  private grounded = false;
  private crouched = false;
  private ceilingBump = false;

  private verticalVelocity = 0;
  private horizontalVelocity = new THREE.Vector3();
  private capabilities = { canJump: true, canSprint: false };
  private resolveCapabilities(): void {
    this.capabilities = {
      canJump: this.grounded && !this.crouched,
      canSprint: !this.crouched,
    };
  }
  private tryJump(input: CharacterInput): void {
    this.jumped = false;
    if (!input.jumping || !this.capabilities.canJump) return;

    this.verticalVelocity = CharacterConfig.jump.force;
    this.jumped = true;
  }
  private updateGravity(delta: number): void {
    if (this.grounded && this.verticalVelocity < 0) this.verticalVelocity = 0;
    if (this.ceilingBump && this.verticalVelocity > 0)
      this.verticalVelocity = 0;

    this.verticalVelocity += GameConfig.physics.gravity.y * delta;
  }
  private updateHorizontalVelocity(input: CharacterInput, delta: number): void {
    const sprinting = input.sprinting && this.capabilities.canSprint;

    let speed = sprinting
      ? CharacterConfig.movement.sprintSpeed
      : CharacterConfig.movement.speed;
    if (this.crouched) speed *= CharacterConfig.movement.crouchMultiplier;

    const targetVelocity = input.direction.clone().multiplyScalar(speed);

    const acceleration = CharacterConfig.movement.acceleration;
    const deceleration = CharacterConfig.movement.deceleration;
    const rate = input.direction.lengthSq() > 0 ? acceleration : deceleration;
    this.horizontalVelocity.lerp(targetVelocity, 1 - Math.exp(-rate * delta));

    const threshold = CharacterConfig.movement.restVelocityThreshold;
    if (this.horizontalVelocity.lengthSq() < threshold * threshold)
      this.horizontalVelocity.set(0, 0, 0);
  }
  private getMovement(delta: number): THREE.Vector3 {
    return new THREE.Vector3(
      this.horizontalVelocity.x * delta,
      this.verticalVelocity * delta,
      this.horizontalVelocity.z * delta,
    );
  }
  public fixedUpdate(input: CharacterInput, delta: number): THREE.Vector3 {
    this.resolveCapabilities();
    this.tryJump(input);
    this.updateGravity(delta);
    this.updateHorizontalVelocity(input, delta);

    return this.getMovement(delta);
  }
  public setGrounded(value: boolean): void {
    this.grounded = value;
  }
  public setCeilingBump(value: boolean): void {
    this.ceilingBump = value;
  }
  public setCrouched(value: boolean): void {
    this.crouched = value;
  }
  public get velocity(): THREE.Vector3 {
    const reportedVertical = this.grounded ? 0 : this.verticalVelocity;
    return new THREE.Vector3(
      this.horizontalVelocity.x,
      reportedVertical,
      this.horizontalVelocity.z,
    );
  }
  public get justJumped(): boolean {
    return this.jumped;
  }
}
