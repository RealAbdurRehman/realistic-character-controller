import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

import CharacterConfig from "./CharacterConfig";

export default class CharacterPhysics {
  private stuckFrames = 0;
  private crouched = false;

  private readonly world: RAPIER.World;
  private readonly collider: RAPIER.Collider;
  private readonly controller: RAPIER.KinematicCharacterController;
  private standingShape: RAPIER.Capsule;

  private readonly _position = new THREE.Vector3();
  private readonly _wallNormal = new THREE.Vector3();
  private readonly _groundNormal = new THREE.Vector3();

  private readonly standingShapeQueryPos = { x: 0, y: 0, z: 0 };
  private readonly standingShapeRotation = { x: 0, y: 0, z: 0, w: 1 };
  constructor(world: RAPIER.World, position: THREE.Vector3) {
    this.world = world;
    this.controller = this.createController(world);
    this.collider = this.createCollider(world);
    this.standingShape = new RAPIER.Capsule(
      CharacterConfig.collider.standingHalfHeight,
      CharacterConfig.collider.radius,
    );

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
    const translation = this.collider.translation();
    const correctedMovement = this.controller.computedMovement();
    this.collider.setTranslation({
      x: translation.x + correctedMovement.x,
      y: translation.y + correctedMovement.y,
      z: translation.z + correctedMovement.z,
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

    let avgX = 0;
    let avgY = 0;
    let avgZ = 0;

    for (let i = 0; i < count; i++) {
      const n = this.controller.computedCollision(i)?.normal1;
      if (n) {
        avgX += n.x;
        avgY += n.y;
        avgZ += n.z;
      }
    }

    const lenSq = avgX * avgX + avgY * avgY + avgZ * avgZ;
    if (lenSq === 0) return;

    const invLen = 1 / Math.sqrt(lenSq);
    avgX *= invLen;
    avgY *= invLen;
    avgZ *= invLen;

    const nudge = 0.05;
    const translation = this.collider.translation();
    this.collider.setTranslation({
      x: translation.x + avgX * nudge,
      y: translation.y + avgY * nudge,
      z: translation.z + avgZ * nudge,
    });
    this.stuckFrames = 0;
  }
  private resizeCapsule(newHalfHeight: number): void {
    const oldHalfHeight = this.crouched
      ? CharacterConfig.crouch.halfHeight
      : CharacterConfig.collider.standingHalfHeight;

    const halfHeightDelta = newHalfHeight - oldHalfHeight;
    const translation = this.collider.translation();

    this.collider.setShape(
      new RAPIER.Capsule(newHalfHeight, CharacterConfig.collider.radius),
    );

    this.collider.setTranslation({
      x: translation.x,
      y: translation.y + halfHeightDelta,
      z: translation.z,
    });
  }
  private canStand(): boolean {
    if (!this.crouched) return true;

    const translation = this.collider.translation();
    const standingHalfHeight = CharacterConfig.collider.standingHalfHeight;
    const crouchingHalfHeight = CharacterConfig.crouch.halfHeight;
    const heightDifference = standingHalfHeight - crouchingHalfHeight;

    this.standingShapeQueryPos.x = translation.x;
    this.standingShapeQueryPos.y = translation.y + heightDifference;
    this.standingShapeQueryPos.z = translation.z;

    const hit = this.world.intersectionWithShape(
      this.standingShapeQueryPos,
      this.standingShapeRotation,
      this.standingShape,
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
    const translation = this.collider.translation();
    return this._position.set(translation.x, translation.y, translation.z);
  }
  public get groundNormal(): THREE.Vector3 | null {
    let found = false;
    let bestUpDot = -1;
    let bestX = 0,
      bestY = 0,
      bestZ = 0;

    const count = this.controller.numComputedCollisions();
    for (let i = 0; i < count; i++) {
      const collision = this.controller.computedCollision(i);
      const n = collision?.normal1;
      if (!n || n.y <= bestUpDot) continue;
      bestUpDot = n.y;
      bestX = n.x;
      bestY = n.y;
      bestZ = n.z;
      found = true;
    }

    if (!found) return null;
    return this._groundNormal.set(bestX, bestY, bestZ);
  }
  public get wallNormal(): THREE.Vector3 | null {
    const count = this.controller.numComputedCollisions();
    for (let i = 0; i < count; i++) {
      const n = this.controller.computedCollision(i)?.normal1;
      if (n && Math.abs(n.y) < 0.3) return this._wallNormal.set(n.x, n.y, n.z);
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
