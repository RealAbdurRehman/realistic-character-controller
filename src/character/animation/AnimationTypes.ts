import * as THREE from "three";

export type LocomotionState = "Idle" | "Walk" | "Run";
export type VerticalState = "Jump" | "Fall" | "Land";
export type AnimationState = LocomotionState | VerticalState;

export interface AnimationClipMap {
  Idle?: THREE.AnimationClip;
  Walk?: THREE.AnimationClip;
  Run?: THREE.AnimationClip;
  Jump?: THREE.AnimationClip;
  Fall?: THREE.AnimationClip;
  Land?: THREE.AnimationClip;
  [key: string]: THREE.AnimationClip | undefined;
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
    fallVelocityThreshold: -0.45,
    minimumLandingHeight: 0.12,
    minimumLandHoldTime: 0.22,
  },
} as const;
