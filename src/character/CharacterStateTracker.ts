import * as THREE from "three";

import CharacterConfig from "./CharacterConfig";
import type CharacterState from "./CharacterState";

const WORLD_UP = new THREE.Vector3(0, 1, 0);

const tempHorizontalVelocity = new THREE.Vector3();
const tempRight = new THREE.Vector3();

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
  wantsToMove: boolean;
  groundNormal: THREE.Vector3 | null;
  sliding: boolean;
  ceilingBump: boolean;
  wallNormal: THREE.Vector3 | null;
}

export default class CharacterStateTracker {
  private wasGrounded = false;
  private wasCrouched = false;
  private wasWantsToMove = false;

  private airborneTime = 0;
  private sinceJump = Infinity;
  private peakHeight = 0;
  private peakFallSpeed = 0;
  private currentFallHeight = 0;

  private pendingJustLanded = false;
  private pendingJustLeftGround = false;
  private pendingJustJumped = false;
  private pendingJustStartedMoving = false;
  private pendingJustStoppedMoving = false;
  private pendingJustCrouched = false;
  private pendingJustStood = false;

  private readonly groundNormalVector = new THREE.Vector3();
  private readonly wallNormalVector = new THREE.Vector3();

  private readonly state: CharacterState = {
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

    wantsToMove: false,
    justStartedMoving: false,
    justStoppedMoving: false,

    isMoving: false,
    isSprinting: false,
    isCrouched: false,
    justCrouched: false,
    justStood: false,

    isFalling: false,
    isRising: false,
    fallHeight: 0,
    fallSpeed: 0,
    justJumped: false,

    groundNormal: null,
    slopeAngle: 0,
    isSliding: false,
    isCeilingBump: false,

    isWallCollision: false,
    wallNormal: null,
  };
  public update(params: StateUpdateParams): void {
    const restThreshold = CharacterConfig.movement.restVelocityThreshold;

    tempHorizontalVelocity.set(params.velocity.x, 0, params.velocity.z);
    const horizontalSpeed = tempHorizontalVelocity.length();
    const isMoving = horizontalSpeed > restThreshold;

    this.airborneTime = params.grounded ? 0 : this.airborneTime + params.delta;
    this.sinceJump = params.jumped ? 0 : this.sinceJump + params.delta;

    if (!params.grounded) {
      this.peakHeight = this.wasGrounded
        ? params.position.y
        : Math.max(this.peakHeight, params.position.y);
      this.currentFallHeight = Math.max(0, this.peakHeight - params.position.y);
      this.peakFallSpeed = this.wasGrounded
        ? Math.max(0, -params.velocity.y)
        : Math.max(this.peakFallSpeed, -params.velocity.y);
    }

    const slopeAngle = params.groundNormal
      ? params.groundNormal.angleTo(WORLD_UP)
      : 0;

    const state = this.state;
    state.grounded = params.grounded;

    this.pendingJustLanded ||= params.grounded && !this.wasGrounded;
    this.pendingJustLeftGround ||=
      !params.grounded && this.wasGrounded && !params.jumped;
    state.justLanded = this.pendingJustLanded;
    state.justLeftGround = this.pendingJustLeftGround;

    state.timeSinceGrounded = this.airborneTime;
    state.timeSinceJump = this.sinceJump;

    state.velocity.copy(params.velocity);
    state.horizontalVelocity.copy(tempHorizontalVelocity);
    state.horizontalSpeed = horizontalSpeed;
    state.verticalVelocity = params.velocity.y;
    state.speedRatio =
      params.maxSpeed > 0
        ? THREE.MathUtils.clamp(horizontalSpeed / params.maxSpeed, 0, 1)
        : 0;

    state.turnAngle = params.turnAngle;
    state.turnDirection = params.turnDirection;
    state.turnSpeed = params.turnSpeed;
    state.isTurning =
      Math.abs(params.turnAngle) > THREE.MathUtils.degToRad(2) &&
      params.turnSpeed > 0;

    state.facing.copy(params.facing);
    state.desiredFacing.copy(params.desiredFacing);

    if (isMoving) {
      state.movementDirection.copy(tempHorizontalVelocity).normalize();

      tempRight.crossVectors(params.facing, WORLD_UP).normalize();
      const strafe = tempHorizontalVelocity.dot(tempRight);
      const forward = tempHorizontalVelocity.dot(params.facing);
      state.localMovementDirection.set(strafe, 0, forward).normalize();
    } else {
      state.movementDirection.set(0, 0, 0);
      state.localMovementDirection.set(0, 0, 0);
    }

    state.wantsToMove = params.wantsToMove;

    this.pendingJustStartedMoving ||=
      params.wantsToMove && !this.wasWantsToMove;
    this.pendingJustStoppedMoving ||=
      !params.wantsToMove && this.wasWantsToMove;
    state.justStartedMoving = this.pendingJustStartedMoving;
    state.justStoppedMoving = this.pendingJustStoppedMoving;

    state.isMoving = isMoving;
    state.isSprinting = params.sprinting && isMoving;
    state.isCrouched = params.crouched;

    this.pendingJustCrouched ||= params.crouched && !this.wasCrouched;
    this.pendingJustStood ||= !params.crouched && this.wasCrouched;
    state.justCrouched = this.pendingJustCrouched;
    state.justStood = this.pendingJustStood;

    state.isFalling = !params.grounded && params.velocity.y < -restThreshold;
    state.isRising = !params.grounded && params.velocity.y > restThreshold;
    state.fallHeight = this.currentFallHeight;
    state.fallSpeed = this.peakFallSpeed;

    this.pendingJustJumped ||= params.jumped;
    state.justJumped = this.pendingJustJumped;

    if (params.groundNormal) {
      this.groundNormalVector.copy(params.groundNormal);
      state.groundNormal = this.groundNormalVector;
    } else state.groundNormal = null;

    state.slopeAngle = slopeAngle;
    state.isSliding = params.sliding;
    state.isCeilingBump = params.ceilingBump;
    state.isWallCollision = params.wallNormal !== null;

    if (params.wallNormal) {
      this.wallNormalVector.copy(params.wallNormal);
      state.wallNormal = this.wallNormalVector;
    } else state.wallNormal = null;

    this.wasGrounded = params.grounded;
    this.wasCrouched = params.crouched;

    this.wasWantsToMove = params.wantsToMove;
  }
  public getState(): Readonly<CharacterState> {
    return this.state;
  }
  public consumeFrameEvents(): void {
    this.pendingJustLanded = false;
    this.pendingJustLeftGround = false;
    this.pendingJustJumped = false;
    this.pendingJustStartedMoving = false;
    this.pendingJustStoppedMoving = false;
    this.pendingJustCrouched = false;
    this.pendingJustStood = false;
  }
}
