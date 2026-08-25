import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

import CharacterConfig from "./CharacterConfig";

export default class CharacterPhysics {
  private readonly collider: RAPIER.Collider;
  private readonly controller: RAPIER.KinematicCharacterController;
  constructor(world: RAPIER.World, position: THREE.Vector3) {
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
  private applyMovement(): void {
    const position = this.position;
    const correctedMovement = this.controller.computedMovement();
    this.collider.setTranslation({
      x: position.x + correctedMovement.x,
      y: position.y + correctedMovement.y,
      z: position.z + correctedMovement.z,
    });
  }
  public move(movement: THREE.Vector3): void {
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
}
