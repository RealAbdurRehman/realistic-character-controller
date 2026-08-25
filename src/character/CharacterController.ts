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
  private previousPosition = new THREE.Vector3();
  constructor(world: RAPIER.World, position: THREE.Vector3) {
    this.motor = new CharacterMotor();
    this.physics = new CharacterPhysics(world, position);
    this.stateTracker = new CharacterStateTracker();
    this.previousPosition.copy(this.physics.position);
  }
  private updateState(input: CharacterInput, delta: number): void {
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
      facing: input.facing,
      maxSpeed: input.sprinting
        ? CharacterConfig.movement.sprintSpeed
        : CharacterConfig.movement.speed,
      sprinting: input.sprinting,
      jumped: this.motor.justJumped,
      groundNormal,
      sliding: this.physics.grounded && slopeAngleRad > maxClimbRad,
      ceilingBump: this.physics.ceilingBump,
      wallNormal: this.physics.wallNormal,
    });
  }
  public fixedUpdate(input: CharacterInput, delta: number): void {
    this.previousPosition.copy(this.physics.position);
    this.physics.move(this.motor.fixedUpdate(input, delta));
    this.motor.setGrounded(this.physics.grounded);
    this.motor.setCeilingBump(this.physics.ceilingBump);
    this.updateState(input, delta);
  }
  public getState(): Readonly<CharacterState> {
    return this.stateTracker.getState();
  }
  public getInterpolatedPosition(alpha: number): THREE.Vector3 {
    return this.previousPosition.clone().lerp(this.physics.position, alpha);
  }
}
