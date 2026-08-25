import * as THREE from "three";

import CharacterConfig from "./CharacterConfig";
import type CharacterState from "./CharacterState";

const WORLD_UP = new THREE.Vector3(0, 1, 0);

interface StateUpdateParams {
  delta: number;
  grounded: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  facing: THREE.Vector3;
  maxSpeed: number;
  sprinting: boolean;
  jumped: boolean;
  groundNormal: THREE.Vector3 | null;
  sliding: boolean;
  ceilingBump: boolean;
  wallNormal: THREE.Vector3 | null;
}

export default class CharacterStateTracker {
  private wasGrounded = false;
  private airborneTime = 0;
  private sinceJump = Infinity;
  private peakHeight = 0;
  private currentFallHeight = 0;
  private state: CharacterState = this.createDefaultState();
  private createDefaultState(): CharacterState {
    return {
      grounded: false,
      justLanded: false,
      justLeftGround: false,
      timeSinceGrounded: 0,
      timeSinceJump: Infinity,
      velocity: new THREE.Vector3(),
      horizontalVelocity: new THREE.Vector3(),
      horizontalSpeed: 0,
      verticalVelocity: 0,
      speedRatio: 0,
      movementDirection: new THREE.Vector3(),
      localMovementDirection: new THREE.Vector3(),
      isMoving: false,
      isSprinting: false,
      isFalling: false,
      isRising: false,
      fallHeight: 0,
      justJumped: false,
      groundNormal: null,
      slopeAngle: 0,
      isSliding: false,
      isCeilingBump: false,
      isWallCollision: false,
      wallNormal: null,
    };
  }
  public update(params: StateUpdateParams): void {
    const {
      delta,
      grounded,
      position,
      velocity,
      facing,
      maxSpeed,
      sprinting,
      jumped,
      groundNormal,
      sliding,
      ceilingBump,
      wallNormal,
    } = params;

    const restThreshold = CharacterConfig.movement.restVelocityThreshold;
    const horizontalVelocity = new THREE.Vector3(velocity.x, 0, velocity.z);
    const horizontalSpeed = horizontalVelocity.length();

    this.airborneTime = grounded ? 0 : this.airborneTime + delta;
    this.sinceJump = jumped ? 0 : this.sinceJump + delta;

    const slopeAngle = groundNormal
      ? groundNormal.angleTo(new THREE.Vector3(0, 1, 0))
      : 0;

    if (!grounded) {
      this.peakHeight = this.wasGrounded
        ? position.y
        : Math.max(this.peakHeight, position.y);
      this.currentFallHeight = Math.max(0, this.peakHeight - position.y);
    }

    let localMovementDirection = new THREE.Vector3();
    if (horizontalSpeed > restThreshold) {
      const right = new THREE.Vector3()
        .crossVectors(facing, WORLD_UP)
        .normalize();
      const strafe = horizontalVelocity.dot(right);
      const fwd = horizontalVelocity.dot(facing);
      localMovementDirection = new THREE.Vector3(strafe, 0, fwd).normalize();
    }

    this.state = {
      grounded,
      justLanded: grounded && !this.wasGrounded,
      justLeftGround: !grounded && this.wasGrounded && !jumped,
      timeSinceGrounded: this.airborneTime,
      timeSinceJump: this.sinceJump,
      velocity: velocity.clone(),
      horizontalVelocity,
      horizontalSpeed,
      verticalVelocity: velocity.y,
      speedRatio:
        maxSpeed > 0
          ? THREE.MathUtils.clamp(horizontalSpeed / maxSpeed, 0, 1)
          : 0,
      movementDirection:
        horizontalSpeed > restThreshold
          ? horizontalVelocity.clone().normalize()
          : new THREE.Vector3(),
      localMovementDirection,
      isMoving: horizontalSpeed > restThreshold,
      isSprinting: sprinting && horizontalSpeed > restThreshold,
      isFalling: !grounded && velocity.y < -restThreshold,
      isRising: !grounded && velocity.y > restThreshold,
      fallHeight: this.currentFallHeight,
      justJumped: jumped,
      groundNormal,
      slopeAngle,
      isSliding: sliding,
      isCeilingBump: ceilingBump,
      isWallCollision: wallNormal !== null,
      wallNormal,
    };

    this.wasGrounded = grounded;
  }
  public getState(): Readonly<CharacterState> {
    return this.state;
  }
}
