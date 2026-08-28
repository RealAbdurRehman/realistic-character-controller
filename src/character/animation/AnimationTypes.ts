import * as THREE from "three";

export type LocomotionState = "Idle" | "Walk" | "Run";

export interface AnimationClipMap {
  Idle?: THREE.AnimationClip;
  Walk?: THREE.AnimationClip;
  Run?: THREE.AnimationClip;
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
