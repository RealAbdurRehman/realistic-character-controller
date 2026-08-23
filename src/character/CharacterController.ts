import RAPIER from "@dimforge/rapier3d-compat";

import GameConfig from "../config/GameConfig";
import CharacterConfig from "./CharacterConfig";

import type { Direction, Vector3 } from "../types/Vector";

export default class CharacterController {
  private readonly collider: RAPIER.Collider;
  private readonly controller: RAPIER.KinematicCharacterController;

  private verticalVelocity = 0;
  constructor(world: RAPIER.World) {
    this.controller = this.createController(world);
    this.collider = this.createCollider(world);

    this.init();
  }
  private init(): void {
    this.collider.setTranslation({ x: 0, y: 2, z: 0 });
  }
  private createController(
    world: RAPIER.World,
  ): RAPIER.KinematicCharacterController {
    const controller = world.createCharacterController(0.01);
    controller.enableAutostep(0.5, 0.2, true);
    controller.enableSnapToGround(0.5);

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
  private getMovement(direction: Direction, delta: number): Vector3 {
    const speed = CharacterConfig.movement.speed;
    return {
      x: direction.x * speed * delta,
      y: this.verticalVelocity * delta,
      z: direction.z * speed * delta,
    };
  }
  private applyMovement(): void {
    const correctedMovement = this.controller.computedMovement();
    this.collider.setTranslation({
      x: this.position.x + correctedMovement.x,
      y: this.position.y + correctedMovement.y,
      z: this.position.z + correctedMovement.z,
    });
  }
  public fixedUpdate(direction: Direction, delta: number): void {
    this.updateGravity(delta);

    const movement = this.getMovement(direction, delta);
    this.controller.computeColliderMovement(this.collider, movement);

    this.applyMovement();
  }
  public get grounded(): boolean {
    return this.controller.computedGrounded();
  }
  public get position(): Vector3 {
    const position = this.collider.translation();
    return { x: position.x, y: position.y, z: position.z };
  }
}
