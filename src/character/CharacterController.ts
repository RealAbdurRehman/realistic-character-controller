import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

import CharacterMotor from "./CharacterMotor";
import CharacterPhysics from "./CharacterPhysics";
import CharacterStateTracker from "./CharacterStateTracker";

import CharacterConfig from "./CharacterConfig";
import type CharacterState from "./CharacterState";
import type CharacterInput from "./CharacterInput";

const WORLD_UP = new THREE.Vector3(0, 1, 0);

export default class CharacterController {
  private currentPosition: THREE.Vector3;
  private previousPosition: THREE.Vector3;

  private readonly previousQuaternion = new THREE.Quaternion();
  private readonly currentQuaternion = new THREE.Quaternion();
  private readonly interpolatedQuaternion = new THREE.Quaternion();
  private readonly interpolatedPosition = new THREE.Vector3();

  private readonly motor: CharacterMotor;
  private readonly physics: CharacterPhysics;
  private readonly stateTracker: CharacterStateTracker;
  public constructor(world: RAPIER.World, position: THREE.Vector3) {
    this.motor = new CharacterMotor();
    this.physics = new CharacterPhysics(world, position);
    this.stateTracker = new CharacterStateTracker();

    this.currentPosition = position.clone();
    this.previousPosition = position.clone();

    this.previousQuaternion.setFromAxisAngle(
      WORLD_UP,
      Math.atan2(this.motor.facing.x, this.motor.facing.z),
    );
    this.currentQuaternion.copy(this.previousQuaternion);
  }
  private updateState(delta: number, input: CharacterInput): void {
    const groundNormal = this.physics.groundNormal;
    const slopeAngle = groundNormal ? groundNormal.angleTo(WORLD_UP) : 0;
    const maxClimbAngle = THREE.MathUtils.degToRad(
      CharacterConfig.slope.maxClimbAngle,
    );

    this.stateTracker.update({
      delta,
      grounded: this.physics.grounded,
      position: this.physics.position,
      velocity: this.motor.velocity,
      facing: this.motor.facing,
      desiredFacing: this.motor.desiredFacing,
      turnAngle: this.motor.turnAngle,
      turnDirection: this.motor.turnDirection,
      turnSpeed: this.motor.currentTurnSpeed,
      maxSpeed: this.motor.isSprinting
        ? CharacterConfig.movement.sprintSpeed
        : CharacterConfig.movement.speed,
      sprinting: this.motor.isSprinting,
      crouched: this.physics.isCrouched,
      jumped: this.motor.justJumped,
      wantsToMove: input.direction.lengthSq() > 0.001,
      groundNormal,
      sliding: this.physics.grounded && slopeAngle > maxClimbAngle,
      ceilingBump: this.physics.ceilingBump,
      wallNormal: this.physics.wallNormal,
    });
  }
  public fixedUpdate(input: CharacterInput, delta: number): void {
    this.previousPosition.copy(this.physics.position);
    this.previousQuaternion.copy(this.currentQuaternion);

    if (input.crouching && this.physics.grounded)
      this.physics.setCrouching(true);
    else if (!input.crouching) this.physics.setCrouching(false);

    if (!this.physics.grounded && this.physics.isCrouched)
      this.physics.setCrouching(false);

    this.motor.setCrouched(this.physics.isCrouched);
    this.motor.setGrounded(this.physics.grounded);
    this.motor.setCeilingBump(this.physics.ceilingBump);

    const movement = this.motor.fixedUpdate(input, delta);
    this.physics.move(movement);
    this.currentPosition.copy(this.physics.position);
    this.currentQuaternion.setFromAxisAngle(
      WORLD_UP,
      Math.atan2(this.motor.facing.x, this.motor.facing.z),
    );

    this.updateState(delta, input);
  }
  public getState(): Readonly<CharacterState> {
    return this.stateTracker.getState();
  }
  public getInterpolatedPosition(alpha: number): THREE.Vector3 {
    return this.interpolatedPosition
      .copy(this.previousPosition)
      .lerp(this.physics.position, alpha);
  }
  public getInterpolatedRotation(alpha: number): THREE.Quaternion {
    return this.interpolatedQuaternion
      .copy(this.previousQuaternion)
      .slerp(this.currentQuaternion, alpha);
  }
}
