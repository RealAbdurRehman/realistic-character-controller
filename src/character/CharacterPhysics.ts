import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

import CharacterConfig from "./CharacterConfig";

export default class CharacterPhysics {
  private stuckFrames = 0;
  private crouched = false;
  private readonly world: RAPIER.World;
  private readonly collider: RAPIER.Collider;
  private readonly controller: RAPIER.KinematicCharacterController;
  constructor(world: RAPIER.World, position: THREE.Vector3) {
    this.world = world;
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
    const colliderDesc = RAPIER.ColliderDesc.capsule(
      CharacterConfig.collider.standingHalfHeight,
      CharacterConfig.collider.radius,
    );
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
  private tryUnstuck(): void {
    const count = this.controller.numComputedCollisions();
    if (count === 0) {
      this.stuckFrames = 0;
      return;
    }

    const grounded = this.grounded;
    const ceiling = this.ceilingBump;
    if (!(grounded && ceiling)) {
      this.stuckFrames = 0;
      return;
    }

    this.stuckFrames++;
    if (this.stuckFrames < 3) return;

    const avg = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const n = this.controller.computedCollision(i)?.normal1;
      if (n) avg.add(new THREE.Vector3(n.x, n.y, n.z));
    }

    if (avg.lengthSq() === 0) return;
    avg.normalize();

    const nudge = 0.05;
    const p = this.position;
    this.collider.setTranslation({
      x: p.x + avg.x * nudge,
      y: p.y + avg.y * nudge,
      z: p.z + avg.z * nudge,
    });
    this.stuckFrames = 0;
  }
  private resizeCapsule(newHalfHeight: number): void {
    const oldHalfHeight = this.crouched
      ? CharacterConfig.crouch.halfHeight
      : CharacterConfig.collider.standingHalfHeight;

    const halfHeightDelta = newHalfHeight - oldHalfHeight;
    const position = this.position;

    this.collider.setShape(
      new RAPIER.Capsule(newHalfHeight, CharacterConfig.collider.radius),
    );

    this.collider.setTranslation({
      x: position.x,
      y: position.y + halfHeightDelta,
      z: position.z,
    });
  }
  private canStand(): boolean {
    if (!this.crouched) return true;

    const position = this.position;
    const standingHalfHeight = CharacterConfig.collider.standingHalfHeight;
    const crouchingHalfHeight = CharacterConfig.crouch.halfHeight;
    const heightDifference = standingHalfHeight - crouchingHalfHeight;
    const standingPosition = {
      x: position.x,
      y: position.y + heightDifference,
      z: position.z,
    };
    const standingShape = new RAPIER.Capsule(
      standingHalfHeight,
      CharacterConfig.collider.radius,
    );

    const hit = this.world.intersectionWithShape(
      standingPosition,
      { x: 0, y: 0, z: 0, w: 1 },
      standingShape,
      undefined,
      undefined,
      this.collider,
    );

    return hit === null;
  }
  private enterCrouch(): void {
    if (this.crouched) return;

    this.resizeCapsule(CharacterConfig.crouch.halfHeight);
    this.crouched = true;
  }
  private tryStand(): void {
    if (!this.crouched) return;
    if (!this.canStand()) return;

    this.resizeCapsule(CharacterConfig.collider.standingHalfHeight);
    this.crouched = false;
  }
  public move(movement: THREE.Vector3): void {
    this.controller.computeColliderMovement(this.collider, movement);
    this.applyMovement();
    this.tryUnstuck();
  }
  public setCrouching(wantsCrouching: boolean): void {
    if (wantsCrouching) {
      this.enterCrouch();
      return;
    }

    this.tryStand();
  }
  public get grounded(): boolean {
    return this.controller.computedGrounded();
  }
  public get position(): THREE.Vector3 {
    const position = this.collider.translation();
    return new THREE.Vector3(position.x, position.y, position.z);
  }
  public get groundNormal(): THREE.Vector3 | null {
    let best: THREE.Vector3 | null = null;
    let bestUpDot = -1;
    const count = this.controller.numComputedCollisions();
    for (let i = 0; i < count; i++) {
      const collision = this.controller.computedCollision(i);
      const n = collision?.normal1;
      if (!n || n.y <= bestUpDot) continue;
      bestUpDot = n.y;
      best = new THREE.Vector3(n.x, n.y, n.z);
    }

    return best;
  }
  public get wallNormal(): THREE.Vector3 | null {
    const count = this.controller.numComputedCollisions();
    for (let i = 0; i < count; i++) {
      const n = this.controller.computedCollision(i)?.normal1;
      if (n && Math.abs(n.y) < 0.3) return new THREE.Vector3(n.x, n.y, n.z);
    }
    return null;
  }
  public get ceilingBump(): boolean {
    const count = this.controller.numComputedCollisions();
    for (let i = 0; i < count; i++) {
      const n = this.controller.computedCollision(i)?.normal1;
      if (n && n.y < -0.5) return true;
    }

    return false;
  }
  public get isCrouched(): boolean {
    return this.crouched;
  }
}
