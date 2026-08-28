import * as THREE from "three";

import GameConfig from "../config/GameConfig";
import CharacterConfig from "./CharacterConfig";
import type CharacterInput from "./CharacterInput";

const WORLD_UP = new THREE.Vector3(0, 1, 0);

const _cross = new THREE.Vector3();
const _targetVelocity = new THREE.Vector3();

export default class CharacterMotor {
  private jumped = false;
  private grounded = false;
  private crouched = false;
  private ceilingBump = false;
  private effectiveSprinting = false;

  private turnSpeed = 0;
  private verticalVelocity = 0;
  private horizontalVelocity = new THREE.Vector3();
  private facingDirection = new THREE.Vector3(0, 0, -1);
  private desiredFacingDirection = new THREE.Vector3(0, 0, -1);

  private movementDelta = new THREE.Vector3();
  private currentVelocity = new THREE.Vector3();

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
    this.effectiveSprinting = sprinting;

    let speed = sprinting
      ? CharacterConfig.movement.sprintSpeed
      : CharacterConfig.movement.speed;
    if (this.crouched) speed *= CharacterConfig.movement.crouchMultiplier;

    let turnResistance: number =
      CharacterConfig.movement.turnResistance.aligned;
    if (input.direction.lengthSq() > 0 && this.facingDirection.lengthSq() > 0) {
      const angle = this.facingDirection.angleTo(this.desiredFacingDirection);
      const { aligned, opposite } = CharacterConfig.movement.turnResistance;
      turnResistance = THREE.MathUtils.lerp(
        aligned,
        opposite,
        Math.min(angle / Math.PI, 1.0),
      );
    }

    _targetVelocity
      .copy(input.direction)
      .multiplyScalar(speed * turnResistance);

    const acceleration = CharacterConfig.movement.acceleration;
    const deceleration = CharacterConfig.movement.deceleration;
    const rate = input.direction.lengthSq() > 0 ? acceleration : deceleration;
    this.horizontalVelocity.lerp(_targetVelocity, 1 - Math.exp(-rate * delta));

    const threshold = CharacterConfig.movement.restVelocityThreshold;
    if (this.horizontalVelocity.lengthSq() < threshold * threshold)
      this.horizontalVelocity.set(0, 0, 0);
  }
  private getSignedAngle(from: THREE.Vector3, to: THREE.Vector3): number {
    _cross.crossVectors(from, to);
    const dot = THREE.MathUtils.clamp(from.dot(to), -1, 1);
    if (dot < -0.9999) return Math.PI;

    return Math.atan2(_cross.y, dot);
  }
  private updateFacingDirection(input: CharacterInput, delta: number): void {
    if (input.direction.lengthSq() <= 0.0001) {
      this.turnSpeed = 0;
      this.desiredFacingDirection.copy(this.facingDirection);
      return;
    }

    this.desiredFacingDirection.copy(input.direction).setY(0).normalize();
    const angle = this.getSignedAngle(
      this.facingDirection,
      this.desiredFacingDirection,
    );

    const rate = CharacterConfig.movement.rotationSpeed;
    const turnAngle = angle * (1 - Math.exp(-rate * delta));
    this.facingDirection.applyAxisAngle(WORLD_UP, turnAngle);
    this.facingDirection.normalize();

    this.turnSpeed = Math.abs(turnAngle) / delta;
  }
  private getMovement(delta: number): THREE.Vector3 {
    return this.movementDelta.set(
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
    this.updateFacingDirection(input, delta);

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
    return this.currentVelocity.set(
      this.horizontalVelocity.x,
      reportedVertical,
      this.horizontalVelocity.z,
    );
  }
  public get turnAngle(): number {
    return this.getSignedAngle(
      this.facingDirection,
      this.desiredFacingDirection,
    );
  }
  public get turnDirection(): -1 | 0 | 1 {
    if (this.turnSpeed <= 0) return 0;

    const angle = this.turnAngle;
    const threshold = THREE.MathUtils.degToRad(1);
    if (Math.abs(angle) < threshold) return 0;

    return angle > 0 ? 1 : -1;
  }
  public get isSprinting(): boolean {
    return this.effectiveSprinting;
  }
  public get justJumped(): boolean {
    return this.jumped;
  }
  public get facing(): THREE.Vector3 {
    return this.facingDirection;
  }
  public get desiredFacing(): THREE.Vector3 {
    return this.desiredFacingDirection;
  }
  public get currentTurnSpeed(): number {
    return this.turnSpeed;
  }
}
