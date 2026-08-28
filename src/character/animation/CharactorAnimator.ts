import * as THREE from "three";
import {
  LocomotionConfig,
  type LocomotionState,
  type AnimationClipMap,
  type LocomotionWeights,
} from "./AnimationTypes";
import type CharacterState from "../CharacterState";

export default class CharacterAnimator {
  private walkDuration = 1.0;
  private runDuration = 1.0;
  private smoothedTimeScale = 1.0;
  private weights: LocomotionWeights = { Idle: 1.0, Walk: 0.0, Run: 0.0 };

  private readonly mixer: THREE.AnimationMixer;
  private readonly actions = new Map<LocomotionState, THREE.AnimationAction>();
  constructor(root: THREE.Object3D, clips: THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(root);
    this.setupActions(clips);
  }
  private setupActions(clips: THREE.AnimationClip[]): void {
    const clipMap: AnimationClipMap = {};
    for (const clip of clips) {
      const lower = clip.name.toLowerCase();
      if (lower.includes("idle")) clipMap.Idle = clip;
      else if (lower.includes("walk")) clipMap.Walk = clip;
      else if (lower.includes("run")) clipMap.Run = clip;
    }

    const stateKeys: LocomotionState[] = ["Idle", "Walk", "Run"];
    for (const key of stateKeys) {
      const clip = clipMap[key];
      if (clip) {
        const action = this.mixer.clipAction(clip);
        action.setEffectiveTimeScale(1);
        action.setEffectiveWeight(key === "Idle" ? 1 : 0);
        action.play();

        this.actions.set(key, action);

        if (key === "Walk") this.walkDuration = clip.duration;
        if (key === "Run") this.runDuration = clip.duration;
      }
    }
  }
  private computeTargetWeights(speed: number): {
    Idle: number;
    Walk: number;
    Run: number;
  } {
    const { Walk: vWalk, Run: vRun } = LocomotionConfig.speeds;

    if (speed <= 0.05) return { Idle: 1.0, Walk: 0.0, Run: 0.0 };

    if (speed < vWalk) {
      const factor = speed / vWalk;
      return { Idle: 1.0 - factor, Walk: factor, Run: 0.0 };
    }

    if (speed < vRun) {
      const factor = (speed - vWalk) / (vRun - vWalk);
      return { Idle: 0.0, Walk: 1.0 - factor, Run: factor };
    }

    return { Idle: 0.0, Walk: 0.0, Run: 1.0 };
  }
  private syncLocomotionPhases(): void {
    const walkAction = this.actions.get("Walk");
    const runAction = this.actions.get("Run");

    if (!walkAction || !runAction) return;

    if (this.weights.Walk > 0.01 && this.weights.Run > 0.01) {
      if (this.weights.Walk >= this.weights.Run) {
        const normalized =
          (walkAction.time % this.walkDuration) / this.walkDuration;
        runAction.time = normalized * this.runDuration;
      } else {
        const normalized =
          (runAction.time % this.runDuration) / this.runDuration;
        walkAction.time = normalized * this.walkDuration;
      }
    }
  }
  private updatePlaybackRate(speed: number, delta: number): void {
    const walkAction = this.actions.get("Walk");
    const runAction = this.actions.get("Run");
    if (!walkAction || !runAction) return;

    let targetScale = 1.0;
    if (speed > 0.1) {
      const currentRefSpeed =
        this.weights.Walk * LocomotionConfig.speeds.Walk +
        this.weights.Run * LocomotionConfig.speeds.Run;

      if (currentRefSpeed > 0.1) {
        targetScale = THREE.MathUtils.clamp(
          speed / currentRefSpeed,
          LocomotionConfig.timeScaleRange.min,
          LocomotionConfig.timeScaleRange.max,
        );
      }
    }

    this.smoothedTimeScale = THREE.MathUtils.lerp(
      this.smoothedTimeScale,
      targetScale,
      1 - Math.exp(-6 * delta),
    );

    walkAction.setEffectiveTimeScale(this.smoothedTimeScale);
    runAction.setEffectiveTimeScale(this.smoothedTimeScale);
  }
  public update(state: CharacterState, delta: number): void {
    const targetWeights = this.computeTargetWeights(state.horizontalSpeed);
    const damping = 1 - Math.exp(-LocomotionConfig.weightDamping * delta);

    this.weights.Idle = THREE.MathUtils.lerp(
      this.weights.Idle,
      targetWeights.Idle,
      damping,
    );
    this.weights.Walk = THREE.MathUtils.lerp(
      this.weights.Walk,
      targetWeights.Walk,
      damping,
    );
    this.weights.Run = THREE.MathUtils.lerp(
      this.weights.Run,
      targetWeights.Run,
      damping,
    );

    const sum = this.weights.Idle + this.weights.Walk + this.weights.Run || 1.0;
    const finalIdle = this.weights.Idle / sum;
    const finalWalk = this.weights.Walk / sum;
    const finalRun = this.weights.Run / sum;

    const idleAction = this.actions.get("Idle");
    const walkAction = this.actions.get("Walk");
    const runAction = this.actions.get("Run");

    if (idleAction) idleAction.setEffectiveWeight(finalIdle);
    if (walkAction) walkAction.setEffectiveWeight(finalWalk);
    if (runAction) runAction.setEffectiveWeight(finalRun);

    this.syncLocomotionPhases();
    this.updatePlaybackRate(state.horizontalSpeed, delta);

    this.mixer.update(delta);
  }
}
