import * as THREE from "three";

import {
  AnimationConfig,
  LocomotionConfig,
  type AnimationClipMap,
  type LocomotionState,
  type LocomotionWeights,
  type VerticalState,
} from "./AnimationTypes";
import type CharacterState from "../CharacterState";

const UPPER_BODY_ROOT_BONE = "mixamorigSpine";
const LOCOMOTION_STATES: LocomotionState[] = ["Idle", "Walk", "Run"];

export default class CharacterAnimator {
  private walkDuration = 1;
  private runDuration = 1;
  private smoothedTimeScale = 1;

  private verticalStateAge = 0;
  private landTimeRemaining = 0;

  private fullBodyWeight = 0;
  private fullBodyTransition = 1;
  private upperBodyLandWeight = 0;

  private activeVerticalState: VerticalState | null = null;
  private activeFullBodyAction: THREE.AnimationAction | null = null;
  private previousFullBodyAction: THREE.AnimationAction | null = null;
  private upperBodyLandAction: THREE.AnimationAction | null = null;
  private weights: LocomotionWeights = { Idle: 1, Walk: 0, Run: 0 };

  private readonly lowerActions = new Map<
    LocomotionState,
    THREE.AnimationAction
  >();
  private readonly upperActions = new Map<
    LocomotionState,
    THREE.AnimationAction
  >();
  private readonly fullBodyActions = new Map<
    VerticalState,
    THREE.AnimationAction
  >();

  private readonly mixer: THREE.AnimationMixer;
  private readonly allBoneNames = new Set<string>();
  private readonly upperBodyBoneNames = new Set<string>();
  public constructor(root: THREE.Object3D, clips: THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(root);
    this.collectBoneMasks(root);
    this.setupActions(clips);
  }
  private collectBoneMasks(root: THREE.Object3D): void {
    root.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Bone) this.allBoneNames.add(object.name);
    });

    const upperBodyRoot = root.getObjectByName(UPPER_BODY_ROOT_BONE);
    if (!(upperBodyRoot instanceof THREE.Bone)) {
      console.warn(
        `Could not find upper-body root bone "${UPPER_BODY_ROOT_BONE}. Landing will use the full-body animation instead.".`,
      );
      return;
    }

    upperBodyRoot.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Bone)
        this.upperBodyBoneNames.add(object.name);
    });
  }
  private getTrackBoneName(track: THREE.KeyframeTrack): string | null {
    try {
      return THREE.PropertyBinding.parseTrackName(track.name).nodeName ?? null;
    } catch {
      return null;
    }
  }
  private createMaskedClip(
    clip: THREE.AnimationClip,
    name: string,
    includeBone: (boneName: string) => boolean,
  ): THREE.AnimationClip {
    const tracks = clip.tracks.filter((track) => {
      const boneName = this.getTrackBoneName(track);
      return boneName !== null && includeBone(boneName);
    });

    return new THREE.AnimationClip(name, clip.duration, tracks);
  }
  private createAction(
    clip: THREE.AnimationClip,
    loop: THREE.AnimationActionLoopStyles,
    repetitions: number,
  ): THREE.AnimationAction {
    const action = this.mixer.clipAction(clip);
    action.setLoop(loop, repetitions);
    action.clampWhenFinished = loop === THREE.LoopOnce;
    action.setEffectiveWeight(0);
    action.play();

    return action;
  }
  private setupActions(clips: THREE.AnimationClip[]): void {
    const clipMap: AnimationClipMap = {};
    for (const clip of clips) {
      const name = clip.name.toLowerCase();
      if (name.includes("idle1")) clipMap.Idle = clip;
      else if (name === "walk") clipMap.Walk = clip;
      else if (name === "run") clipMap.Run = clip;
      else if (name.includes("jumpmove")) clipMap.Jump = clip;
      else if (name.includes("fall")) clipMap.Fall = clip;
      else if (name.includes("land")) clipMap.Land = clip;
    }

    for (const state of LOCOMOTION_STATES) {
      const source = clipMap[state];
      if (!source) continue;

      const lowerClip = this.createMaskedClip(
        source,
        `${source.name}_LowerBody`,
        (boneName) => !this.upperBodyBoneNames.has(boneName),
      );
      const upperClip = this.createMaskedClip(
        source,
        `${source.name}_UpperBody`,
        (boneName) => this.upperBodyBoneNames.has(boneName),
      );
      const lowerAction = this.createAction(
        lowerClip,
        THREE.LoopRepeat,
        Infinity,
      );

      this.lowerActions.set(state, lowerAction);
      if (upperClip.tracks.length > 0) {
        const upperAction = this.createAction(
          upperClip,
          THREE.LoopRepeat,
          Infinity,
        );

        this.upperActions.set(state, upperAction);
      }

      if (state === "Walk") this.walkDuration = source.duration;
      if (state === "Run") this.runDuration = source.duration;
    }

    for (const state of ["Jump", "Fall", "Land"] as VerticalState[]) {
      const source = clipMap[state];
      if (!source) continue;

      const fullBodyClip = this.createMaskedClip(
        source,
        `${source.name}_FullBody`,
        (boneName) => this.allBoneNames.has(boneName),
      );

      const loop = state === "Fall" ? THREE.LoopRepeat : THREE.LoopOnce;
      const repetitions = state === "Fall" ? Infinity : 1;
      this.fullBodyActions.set(
        state,
        this.createAction(fullBodyClip, loop, repetitions),
      );
    }

    const landClip = clipMap.Land;
    if (landClip && this.upperBodyBoneNames.size > 0) {
      const upperLandClip = this.createMaskedClip(
        landClip,
        `${landClip.name}_UpperBody`,
        (boneName) => this.upperBodyBoneNames.has(boneName),
      );

      if (upperLandClip.tracks.length > 0)
        this.upperBodyLandAction = this.createAction(
          upperLandClip,
          THREE.LoopOnce,
          1,
        );
    }
  }
  private computeTargetWeights(speed: number): LocomotionWeights {
    const { Walk: walkSpeed, Run: runSpeed } = LocomotionConfig.speeds;

    if (speed <= 0.05) return { Idle: 1, Walk: 0, Run: 0 };

    if (speed < walkSpeed) {
      const t = speed / walkSpeed;
      return { Idle: 1 - t, Walk: t, Run: 0 };
    }

    if (speed < runSpeed) {
      const t = (speed - walkSpeed) / (runSpeed - walkSpeed);
      return { Idle: 0, Walk: 1 - t, Run: t };
    }

    return { Idle: 0, Walk: 0, Run: 1 };
  }
  private resolveVerticalState(
    state: CharacterState,
    delta: number,
  ): VerticalState | null {
    if (this.activeVerticalState === "Land") {
      this.landTimeRemaining -= delta;
      if (this.landTimeRemaining > 0) return "Land";
    }

    if (
      state.justLanded &&
      state.fallHeight >= AnimationConfig.vertical.minimumLandingHeight
    )
      return "Land";

    if (state.grounded) return null;
    const shouldHoldJumpPose =
      this.activeVerticalState === "Jump" &&
      this.verticalStateAge < AnimationConfig.vertical.minimumJumpPoseTime;

    if (
      state.justJumped ||
      shouldHoldJumpPose ||
      state.verticalVelocity > AnimationConfig.vertical.fallVelocityThreshold
    )
      return "Jump";

    return "Fall";
  }
  private setVerticalState(next: VerticalState | null): void {
    if (next === this.activeVerticalState) return;

    this.verticalStateAge = 0;
    this.activeVerticalState = next;

    if (next === "Land") {
      const landAction =
        this.upperBodyLandAction ?? this.fullBodyActions.get("Land") ?? null;
      if (landAction) {
        landAction.reset();
        landAction.play();
        this.landTimeRemaining = Math.max(
          landAction.getClip().duration,
          AnimationConfig.vertical.minimumLandHoldTime,
        );
      }

      return;
    }

    if (next !== "Jump" && next !== "Fall") return;

    const nextAction = this.fullBodyActions.get(next);
    if (!nextAction) return;

    this.previousFullBodyAction = this.activeFullBodyAction;
    this.activeFullBodyAction = nextAction;
    this.fullBodyTransition = 0;

    nextAction.reset();
    nextAction.play();
  }
  private updateFullBodyActions(delta: number): void {
    for (const action of this.fullBodyActions.values())
      action.setEffectiveWeight(0);

    if (!this.activeFullBodyAction || this.fullBodyWeight <= 0.001) return;
    if (this.previousFullBodyAction && this.fullBodyTransition < 1) {
      this.fullBodyTransition =
        this.fullBodyTransition +
        delta / AnimationConfig.transitions.jumpToFall;
      this.previousFullBodyAction.setEffectiveWeight(
        this.fullBodyWeight * (1 - this.fullBodyTransition),
      );
      this.activeFullBodyAction.setEffectiveWeight(
        this.fullBodyWeight * this.fullBodyTransition,
      );

      if (this.fullBodyTransition === 1) this.previousFullBodyAction = null;

      return;
    }

    this.activeFullBodyAction.setEffectiveWeight(this.fullBodyWeight);
  }
  private updateLocomotionWeights(state: CharacterState, delta: number): void {
    const target = this.computeTargetWeights(state.horizontalSpeed);
    const damping = 1 - Math.exp(-LocomotionConfig.weightDamping * delta);
    this.weights.Idle = THREE.MathUtils.lerp(
      this.weights.Idle,
      target.Idle,
      damping,
    );
    this.weights.Walk = THREE.MathUtils.lerp(
      this.weights.Walk,
      target.Walk,
      damping,
    );
    this.weights.Run = THREE.MathUtils.lerp(
      this.weights.Run,
      target.Run,
      damping,
    );

    const sum = this.weights.Idle + this.weights.Walk + this.weights.Run || 1;
    const lowerScale = 1 - this.fullBodyWeight;
    const upperScale = lowerScale * (1 - this.upperBodyLandWeight);
    for (const state of LOCOMOTION_STATES) {
      const weight = this.weights[state] / sum;
      this.lowerActions.get(state)?.setEffectiveWeight(weight * lowerScale);
      this.upperActions.get(state)?.setEffectiveWeight(weight * upperScale);
    }
  }
  private syncLocomotionPhases(): void {
    const lowerWalk = this.lowerActions.get("Walk");
    const lowerRun = this.lowerActions.get("Run");
    if (lowerWalk && lowerRun)
      if (this.weights.Walk > 0.01 && this.weights.Run > 0.01)
        if (this.weights.Walk >= this.weights.Run)
          lowerRun.time =
            ((lowerWalk.time % this.walkDuration) / this.walkDuration) *
            this.runDuration;
        else
          lowerWalk.time =
            ((lowerRun.time % this.runDuration) / this.runDuration) *
            this.walkDuration;

    for (const state of LOCOMOTION_STATES) {
      const lower = this.lowerActions.get(state);
      const upper = this.upperActions.get(state);
      if (lower && upper) upper.time = lower.time;
    }
  }

  private updatePlaybackRate(speed: number, delta: number): void {
    let targetScale = 1;
    if (speed > 0.1) {
      const referenceSpeed =
        this.weights.Walk * LocomotionConfig.speeds.Walk +
        this.weights.Run * LocomotionConfig.speeds.Run;
      if (referenceSpeed > 0.1)
        targetScale = THREE.MathUtils.clamp(
          speed / referenceSpeed,
          LocomotionConfig.timeScaleRange.min,
          LocomotionConfig.timeScaleRange.max,
        );
    }

    this.smoothedTimeScale = THREE.MathUtils.lerp(
      this.smoothedTimeScale,
      targetScale,
      1 - Math.exp(-6 * delta),
    );

    for (const actions of [this.lowerActions, this.upperActions]) {
      actions.get("Walk")?.setEffectiveTimeScale(this.smoothedTimeScale);
      actions.get("Run")?.setEffectiveTimeScale(this.smoothedTimeScale);
    }
  }
  public update(state: CharacterState, delta: number): void {
    this.verticalStateAge += delta;

    const verticalState = this.resolveVerticalState(state, delta);
    this.setVerticalState(verticalState);

    const wantsFullBody = verticalState === "Jump" || verticalState === "Fall";
    const wantsUpperLand =
      verticalState === "Land" && this.upperBodyLandAction !== null;

    const fullBlendRate = wantsFullBody
      ? AnimationConfig.transitions.fullBodyIn
      : AnimationConfig.transitions.fullBodyOut;
    const landBlendRate = wantsUpperLand
      ? AnimationConfig.transitions.landIn
      : AnimationConfig.transitions.landOut;
    const fullBlend = 1 - Math.exp(-fullBlendRate * delta);
    const landBlend = 1 - Math.exp(-landBlendRate * delta);
    this.fullBodyWeight = THREE.MathUtils.lerp(
      this.fullBodyWeight,
      wantsFullBody ? 1 : 0,
      fullBlend,
    );

    this.upperBodyLandWeight = THREE.MathUtils.lerp(
      this.upperBodyLandWeight,
      wantsUpperLand ? 1 : 0,
      landBlend,
    );
    this.upperBodyLandAction?.setEffectiveWeight(this.upperBodyLandWeight);

    this.updateLocomotionWeights(state, delta);
    this.syncLocomotionPhases();
    this.updatePlaybackRate(state.horizontalSpeed, delta);
    this.updateFullBodyActions(delta);

    this.mixer.update(delta);
  }
}
