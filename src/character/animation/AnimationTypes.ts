import * as THREE from "three";

export type LocomotionState = "Idle" | "Walk" | "Run";
export type VerticalState = "Jump" | "Fall" | "Land";
export type AnimationState = LocomotionState | VerticalState;

export type JumpVariant = "Idle" | "Move";

export interface AnimationClipMap {
  Idle?: THREE.AnimationClip[];
  Walk?: THREE.AnimationClip;
  Run?: THREE.AnimationClip;
  JumpIdle?: THREE.AnimationClip;
  JumpMove?: THREE.AnimationClip;
  Fall?: THREE.AnimationClip;
  Land?: THREE.AnimationClip;
}

export interface LocomotionWeights {
  Idle: number;
  Walk: number;
  Run: number;
}

export const LocomotionConfig = {
  weightDamping: 8.0,
  speeds: { Idle: 0.0, Walk: 4.2, Run: 6.2 },
  timeScaleRange: { min: 0.8, max: 1.2 },
} as const;

export const AnimationConfig = {
  transitions: {
    locomotion: 8.0,
    fullBodyIn: 10.0,
    fullBodyOut: 12.0,
    jumpToFall: 0.6,
    landIn: 14,
    landOut: 6,
  },
  vertical: {
    minimumJumpPoseTime: 0.7,
    minimumLandingSpeed: 0.3,
    fallVelocityThreshold: -1.5,
    minimumLandingHeight: 0.12,
    minimumLandHoldTime: 0.22,
    jumpMoveThreshold: 0.1,
  },
  idle: {
    crossfadeDuration: 2.0,
    transitionLeadTime: 0.15,
    preventImmediateRepeat: true,
    timeScaleRange: { min: 0.95, max: 1.05 },
  },
} as const;
