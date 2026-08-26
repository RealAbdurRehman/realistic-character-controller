import * as THREE from "three";

export default interface CharacterState {
  grounded: boolean;
  justLanded: boolean;
  justLeftGround: boolean;
  timeSinceGrounded: number;
  timeSinceJump: number;

  velocity: THREE.Vector3;
  horizontalVelocity: THREE.Vector3;
  horizontalSpeed: number;
  verticalVelocity: number;
  speedRatio: number;

  turnAngle: number;
  turnDirection: -1 | 0 | 1;
  turnSpeed: number;
  isTurning: boolean;

  facing: THREE.Vector3;
  desiredFacing: THREE.Vector3;
  movementDirection: THREE.Vector3;
  localMovementDirection: THREE.Vector3;
  isMoving: boolean;
  isSprinting: boolean;
  isCrouched: boolean;

  isFalling: boolean;
  isRising: boolean;
  fallHeight: number; // Valid to read on justLanded
  justJumped: boolean;

  groundNormal: THREE.Vector3 | null;
  slopeAngle: number;
  isSliding: boolean;
  isCeilingBump: boolean;

  isWallCollision: boolean;
  wallNormal: THREE.Vector3 | null;
}
