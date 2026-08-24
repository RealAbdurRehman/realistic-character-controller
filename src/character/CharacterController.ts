import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

import GameConfig from "../config/GameConfig";
import CharacterConfig from "./CharacterConfig";

export default class CharacterController {
  private readonly collider: RAPIER.Collider;
  private readonly controller: RAPIER.KinematicCharacterController;

  private verticalVelocity = 0;
  private previousPosition = new THREE.Vector3();
  constructor(world: RAPIER.World, position: THREE.Vector3) {
    this.previousPosition.copy(position);

    this.controller = this.createController(world);
    this.collider = this.createCollider(world);

    this.init(position);
  }
  private init(position: THREE.Vector3): void {
    this.collider.setTranslation(position);
  }
  private createController(
    world: RAPIER.World,
  ): RAPIER.KinematicCharacterController {
    const controller = world.createCharacterController(
      CharacterConfig.controller.offset,
    );

    controller.enableAutostep(
      CharacterConfig.controller.autostep.maxHeight,
      CharacterConfig.controller.autostep.minWidth,
      true,
    );

    controller.enableSnapToGround(CharacterConfig.controller.snapToGround);

    controller.setMaxSlopeClimbAngle(
      THREE.MathUtils.degToRad(CharacterConfig.slope.maxClimbAngle),
    );
    controller.setMinSlopeSlideAngle(
      THREE.MathUtils.degToRad(CharacterConfig.slope.minSlideAngle),
    );

    return controller;
  }
  private createCollider(world: RAPIER.World): RAPIER.Collider {
    const colliderDesc = RAPIER.ColliderDesc.capsule(1, 0.5);
    return world.createCollider(colliderDesc);
  }
  private updateGravity(delta: number): void {
    if (this.grounded && this.verticalVelocity < 0) this.verticalVelocity = 0;
    this.verticalVelocity += GameConfig.physics.gravity.y * delta;
  }
  private getMovement(direction: THREE.Vector3, delta: number): THREE.Vector3 {
    const speed = CharacterConfig.movement.speed;
    return new THREE.Vector3(
      direction.x * speed * delta,
      this.verticalVelocity * delta,
      direction.z * speed * delta,
    );
  }
  private applyMovement(): void {
    const position = this.position;
    const correctedMovement = this.controller.computedMovement();
    this.collider.setTranslation({
      x: position.x + correctedMovement.x,
      y: position.y + correctedMovement.y,
      z: position.z + correctedMovement.z,
    });
  }
  public fixedUpdate(direction: THREE.Vector3, delta: number): void {
    this.previousPosition.copy(this.position);

    this.updateGravity(delta);

    const movement = this.getMovement(direction, delta);
    this.controller.computeColliderMovement(this.collider, movement);

    this.applyMovement();
  }
  public get grounded(): boolean {
    return this.controller.computedGrounded();
  }
  public get position(): THREE.Vector3 {
    const position = this.collider.translation();
    return new THREE.Vector3(position.x, position.y, position.z);
  }
  public getInterpolatedPosition(alpha: number): THREE.Vector3 {
    return this.previousPosition.clone().lerp(this.position, alpha);
  }
}
