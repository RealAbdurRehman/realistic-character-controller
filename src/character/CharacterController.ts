import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

import CharacterMotor from "./CharacterMotor";
import CharacterPhysics from "./CharacterPhysics";
import CharacterStateTracker from "./CharacterStateTracker";

import CharacterConfig from "./CharacterConfig";
import type CharacterState from "./CharacterState";
import type CharacterInput from "./CharacterInput";

export default class CharacterController {
  private readonly motor: CharacterMotor;
  private readonly physics: CharacterPhysics;
  private readonly stateTracker: CharacterStateTracker;
  private currentPosition: THREE.Vector3;
  private previousPosition: THREE.Vector3;
  constructor(world: RAPIER.World, position: THREE.Vector3) {
    this.motor = new CharacterMotor();
    this.physics = new CharacterPhysics(world, position);
    this.stateTracker = new CharacterStateTracker();

    this.currentPosition = position.clone();
    this.previousPosition = position.clone();
  }
  private updateState(delta: number): void {
    const groundNormal = this.physics.groundNormal;
    const slopeAngleRad = groundNormal
      ? groundNormal.angleTo(new THREE.Vector3(0, 1, 0))
      : 0;
    const maxClimbRad = THREE.MathUtils.degToRad(
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
      groundNormal,
      sliding: this.physics.grounded && slopeAngleRad > maxClimbRad,
      ceilingBump: this.physics.ceilingBump,
      wallNormal: this.physics.wallNormal,
    });
  }
  public fixedUpdate(input: CharacterInput, delta: number): void {
    this.previousPosition.copy(this.physics.position);

    const grounded = this.physics.grounded;

    if (input.crouching && this.physics.grounded)
      this.physics.setCrouching(true);
    else if (!input.crouching) this.physics.setCrouching(false);
    if (!grounded && this.physics.isCrouched) this.physics.setCrouching(false);

    this.motor.setCrouched(this.physics.isCrouched);
    this.motor.setGrounded(this.physics.grounded);
    this.motor.setCeilingBump(this.physics.ceilingBump);

    const movement = this.motor.fixedUpdate(input, delta);
    this.physics.move(movement);
    this.currentPosition.copy(this.physics.position);

    this.updateState(delta);
  }
  public getState(): Readonly<CharacterState> {
    return this.stateTracker.getState();
  }
  public getInterpolatedPosition(alpha: number): THREE.Vector3 {
    return this.previousPosition.clone().lerp(this.physics.position, alpha);
  }
}
