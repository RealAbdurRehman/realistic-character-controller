import * as THREE from "three";

import CharacterConfig from "./CharacterConfig";
import type CharacterState from "./CharacterState";

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const _tempHVel = new THREE.Vector3();
const _tempRight = new THREE.Vector3();

interface StateUpdateParams {
  delta: number;
  grounded: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  facing: THREE.Vector3;
  desiredFacing: THREE.Vector3;
  turnAngle: number;
  turnDirection: -1 | 0 | 1;
  turnSpeed: number;
  maxSpeed: number;
  sprinting: boolean;
  crouched: boolean;
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
  private readonly groundNormalVector = new THREE.Vector3();
  private readonly wallNormalVector = new THREE.Vector3();
  private readonly state: CharacterState = this.createDefaultState();
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
      turnAngle: 0,
      turnDirection: 0,
      turnSpeed: 0,
      isTurning: false,
      facing: new THREE.Vector3(0, 0, -1),
      desiredFacing: new THREE.Vector3(0, 0, -1),
      movementDirection: new THREE.Vector3(),
      localMovementDirection: new THREE.Vector3(),
      isMoving: false,
      isSprinting: false,
      isCrouched: false,
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
      desiredFacing,
      turnAngle,
      turnDirection,
      turnSpeed,
      maxSpeed,
      sprinting,
      crouched,
      jumped,
      groundNormal,
      sliding,
      ceilingBump,
      wallNormal,
    } = params;

    const restThreshold = CharacterConfig.movement.restVelocityThreshold;

    _tempHVel.set(velocity.x, 0, velocity.z);
    const horizontalSpeed = _tempHVel.length();

    this.airborneTime = grounded ? 0 : this.airborneTime + delta;
    this.sinceJump = jumped ? 0 : this.sinceJump + delta;

    const slopeAngle = groundNormal ? groundNormal.angleTo(WORLD_UP) : 0;

    if (!grounded) {
      this.peakHeight = this.wasGrounded
        ? position.y
        : Math.max(this.peakHeight, position.y);
      this.currentFallHeight = Math.max(0, this.peakHeight - position.y);
    }

    if (horizontalSpeed > restThreshold) {
      _tempRight.crossVectors(facing, WORLD_UP).normalize();
      const strafe = _tempHVel.dot(_tempRight);
      const fwd = _tempHVel.dot(facing);
      this.state.localMovementDirection.set(strafe, 0, fwd).normalize();
    } else this.state.localMovementDirection.set(0, 0, 0);

    const isTurning =
      Math.abs(turnAngle) > THREE.MathUtils.degToRad(2) && turnSpeed > 0;
    const isMoving = horizontalSpeed > restThreshold;

    const s = this.state;
    s.grounded = grounded;
    s.justLanded = grounded && !this.wasGrounded;
    s.justLeftGround = !grounded && this.wasGrounded && !jumped;
    s.timeSinceGrounded = this.airborneTime;
    s.timeSinceJump = this.sinceJump;

    s.velocity.copy(velocity);
    s.horizontalVelocity.copy(_tempHVel);
    s.horizontalSpeed = horizontalSpeed;
    s.verticalVelocity = velocity.y;
    s.speedRatio =
      maxSpeed > 0
        ? THREE.MathUtils.clamp(horizontalSpeed / maxSpeed, 0, 1)
        : 0;

    s.turnAngle = turnAngle;
    s.turnDirection = turnDirection;
    s.turnSpeed = turnSpeed;
    s.isTurning = isTurning;
    s.facing.copy(facing);
    s.desiredFacing.copy(desiredFacing);

    if (isMoving) s.movementDirection.copy(_tempHVel).normalize();
    else s.movementDirection.set(0, 0, 0);

    s.isMoving = isMoving;
    s.isSprinting = sprinting && isMoving;
    s.isCrouched = crouched;
    s.isFalling = !grounded && velocity.y < -restThreshold;
    s.isRising = !grounded && velocity.y > restThreshold;

    s.fallHeight = this.currentFallHeight;
    s.justJumped = jumped;

    if (groundNormal) {
      this.groundNormalVector.copy(groundNormal);
      s.groundNormal = this.groundNormalVector;
    } else s.groundNormal = null;

    s.slopeAngle = slopeAngle;
    s.isSliding = sliding;
    s.isCeilingBump = ceilingBump;
    s.isWallCollision = wallNormal !== null;

    if (wallNormal) {
      this.wallNormalVector.copy(wallNormal);
      s.wallNormal = this.wallNormalVector;
    } else s.wallNormal = null;

    this.wasGrounded = grounded;
  }
  public getState(): Readonly<CharacterState> {
    return this.state;
  }
}
