import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

import CharacterMotor from "./CharacterMotor";
import CharacterPhysics from "./CharacterPhysics";

export default class CharacterController {
  private readonly motor: CharacterMotor;
  private readonly physics: CharacterPhysics;
  private previousPosition = new THREE.Vector3();
  constructor(world: RAPIER.World, position: THREE.Vector3) {
    this.motor = new CharacterMotor();
    this.physics = new CharacterPhysics(world, position);
    this.previousPosition.copy(this.physics.position);
  }
  public fixedUpdate(direction: THREE.Vector3, delta: number): void {
    this.previousPosition.copy(this.physics.position);

    const desiredMovement = this.motor.fixedUpdate(direction, delta);
    this.physics.move(desiredMovement);

    this.motor.setGrounded(this.physics.grounded);
  }
  public getInterpolatedPosition(alpha: number): THREE.Vector3 {
    return this.previousPosition.clone().lerp(this.physics.position, alpha);
  }
}
