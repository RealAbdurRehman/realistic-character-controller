import * as THREE from "three";

import {
  AnimationConfig,
  LocomotionConfig,
  type AnimationClipMap,
  type LocomotionState,
  type LocomotionWeights,
  type JumpVariant,
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

  private wasIdle = false;
  private idleTransition = 1;
  private activeIdleIndex = 0;
  private nextIdleIndex: number | null = null;
  private previousIdleIndex: number | null = null;

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

  private readonly jumpActions = new Map<JumpVariant, THREE.AnimationAction>();

  private readonly idleLowerActions: THREE.AnimationAction[] = [];
  private readonly idleUpperActions: THREE.AnimationAction[] = [];

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
      if (name.match(/^idle\d+$/)) {
        if (!clipMap.Idle) clipMap.Idle = [];
        clipMap.Idle.push(clip);
        continue;
      }

      switch (name) {
        case "walk":
          clipMap.Walk = clip;
          break;
        case "run":
          clipMap.Run = clip;
          break;
        case "jumpidle":
          clipMap.JumpIdle = clip;
          break;
        case "jumpmove":
          clipMap.JumpMove = clip;
          break;
        case "fall":
          clipMap.Fall = clip;
          break;
        case "land":
          clipMap.Land = clip;
          break;
      }
    }

    clipMap.Idle?.sort((a, b) => {
      const aNumber = Number(a.name.match(/\d+$/)?.[0] ?? 0);
      const bNumber = Number(b.name.match(/\d+$/)?.[0] ?? 0);
      return aNumber - bNumber;
    });

    const idleClips = clipMap.Idle ?? [];
    for (const source of idleClips) {
      const lowerClip = this.createMaskedClip(
        source,
        `${source.name}_LowerBody`,
        (boneName) => !this.upperBodyBoneNames.has(boneName),
      );

      const lowerAction = this.createAction(lowerClip, THREE.LoopOnce, 1);
      this.idleLowerActions.push(lowerAction);

      const upperClip = this.createMaskedClip(
        source,
        `${source.name}_UpperBody`,
        (boneName) => this.upperBodyBoneNames.has(boneName),
      );

      if (upperClip.tracks.length > 0) {
        const upperAction = this.createAction(upperClip, THREE.LoopOnce, 1);
        this.idleUpperActions.push(upperAction);
      }
    }

    if (this.idleLowerActions.length > 0) {
      this.activeIdleIndex = 0;

      this.idleLowerActions[0].reset();
      this.idleLowerActions[0].setEffectiveWeight(1);
      this.idleLowerActions[0].play();

      if (this.idleUpperActions[0]) {
        this.idleUpperActions[0].reset();
        this.idleUpperActions[0].setEffectiveWeight(1);
        this.idleUpperActions[0].play();
      }
    }

    for (const state of ["Walk", "Run"] as LocomotionState[]) {
      const source = clipMap[state];
      if (!source || Array.isArray(source)) continue;

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

    for (const variant of ["Idle", "Move"] as JumpVariant[]) {
      const source = variant === "Idle" ? clipMap.JumpIdle : clipMap.JumpMove;
      if (!source) continue;

      const fullBodyClip = this.createMaskedClip(
        source,
        `${source.name}_FullBody`,
        (boneName) => this.allBoneNames.has(boneName),
      );
      this.jumpActions.set(
        variant,
        this.createAction(fullBodyClip, THREE.LoopOnce, 1),
      );
    }

    for (const state of ["Fall", "Land"] as const) {
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
  private chooseNextIdle(): number {
    const count = this.idleLowerActions.length;
    if (count <= 1) return 0;

    let index = this.activeIdleIndex;
    while (
      AnimationConfig.idle.preventImmediateRepeat &&
      index === this.activeIdleIndex
    )
      index = Math.floor(Math.random() * count);
    return index;
  }
  private resetIdleToFirst(): void {
    if (this.idleLowerActions.length === 0) return;

    if (this.previousIdleIndex !== null && this.nextIdleIndex !== null) {
      const discard =
        this.idleTransition >= 0.5
          ? this.previousIdleIndex
          : this.nextIdleIndex;
      const keep =
        this.idleTransition >= 0.5
          ? this.nextIdleIndex
          : this.previousIdleIndex;

      this.idleLowerActions[discard].stop();
      this.idleUpperActions[discard]?.stop();

      this.activeIdleIndex = keep;
      this.previousIdleIndex = null;
      this.nextIdleIndex = null;
    }

    if (this.activeIdleIndex === 0) {
      this.idleTransition = 1;
      return;
    }

    this.previousIdleIndex = this.activeIdleIndex;
    this.nextIdleIndex = 0;

    const nextLower = this.idleLowerActions[0];
    nextLower.reset();
    nextLower.setEffectiveWeight(0);
    nextLower.play();

    const nextUpper = this.idleUpperActions[0];
    if (nextUpper) {
      nextUpper.reset();
      nextUpper.setEffectiveWeight(0);
      nextUpper.play();
    }

    this.idleTransition = 0;
  }
  private checkIdleReset(
    state: CharacterState,
    verticalState: VerticalState | null,
  ): void {
    const isIdling = state.horizontalSpeed <= 0.05 && verticalState === null;
    if (isIdling && !this.wasIdle) this.resetIdleToFirst();
    this.wasIdle = isIdling;
  }
  private beginIdleTransition(): void {
    if (this.idleLowerActions.length <= 1) return;
    if (this.idleTransition < 1) return;

    const nextIndex = this.chooseNextIdle();
    this.previousIdleIndex = this.activeIdleIndex;
    this.nextIdleIndex = nextIndex;

    const nextLower = this.idleLowerActions[nextIndex];
    nextLower.reset();
    nextLower.setEffectiveWeight(0);
    nextLower.play();

    const nextUpper = this.idleUpperActions[nextIndex];
    if (nextUpper) {
      nextUpper.reset();
      nextUpper.setEffectiveWeight(0);
      nextUpper.play();
    }

    this.idleTransition = 0;
  }
  private resolveVerticalState(
    state: CharacterState,
    delta: number,
  ): VerticalState | null {
    if (state.justJumped) return "Jump";

    if (!state.grounded) {
      const shouldHoldJumpPose =
        this.activeVerticalState === "Jump" &&
        this.verticalStateAge < AnimationConfig.vertical.minimumJumpPoseTime;

      if (
        shouldHoldJumpPose ||
        state.verticalVelocity > AnimationConfig.vertical.fallVelocityThreshold
      )
        return "Jump";
      return "Fall";
    }

    if (this.activeVerticalState === "Land") {
      this.landTimeRemaining -= delta;
      if (this.landTimeRemaining > 0) return "Land";
    }

    if (
      state.justLanded &&
      (state.fallHeight >= AnimationConfig.vertical.minimumLandingHeight ||
        state.fallSpeed >= AnimationConfig.vertical.minimumLandingSpeed)
    )
      return "Land";

    return null;
  }
  private getJumpAction(state: CharacterState): THREE.AnimationAction | null {
    return this.jumpActions.get(this.getJumpVariant(state)) ?? null;
  }
  private setVerticalState(
    state: CharacterState,
    next: VerticalState | null,
  ): void {
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

    const nextAction =
      next === "Jump"
        ? this.getJumpAction(state)
        : this.fullBodyActions.get("Fall");
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

    for (const action of this.jumpActions.values())
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
  private updateIdleWeights(lowerWeight: number, upperWeight: number): void {
    if (this.idleLowerActions.length === 0) return;
    if (this.previousIdleIndex !== null && this.nextIdleIndex !== null) {
      const t = THREE.MathUtils.clamp(this.idleTransition, 0, 1);
      this.idleLowerActions[this.previousIdleIndex].setEffectiveWeight(
        lowerWeight * (1 - t),
      );
      this.idleLowerActions[this.nextIdleIndex].setEffectiveWeight(
        lowerWeight * t,
      );
      this.idleUpperActions[this.previousIdleIndex]?.setEffectiveWeight(
        upperWeight * (1 - t),
      );
      this.idleUpperActions[this.nextIdleIndex]?.setEffectiveWeight(
        upperWeight * t,
      );

      return;
    }

    this.idleLowerActions[this.activeIdleIndex]?.setEffectiveWeight(
      lowerWeight,
    );
    this.idleUpperActions[this.activeIdleIndex]?.setEffectiveWeight(
      upperWeight,
    );
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
    for (const state of ["Walk", "Run"] as LocomotionState[]) {
      const weight = this.weights[state] / sum;
      this.lowerActions.get(state)?.setEffectiveWeight(weight * lowerScale);
      this.upperActions.get(state)?.setEffectiveWeight(weight * upperScale);
    }

    const idleWeight = (this.weights.Idle / sum) * lowerScale;
    const idleUpperWeight = (this.weights.Idle / sum) * upperScale;
    this.updateIdleWeights(idleWeight, idleUpperWeight);
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
  private checkIdleTransition(state: CharacterState): void {
    if (state.horizontalSpeed > 0.05) return;
    if (this.idleLowerActions.length <= 1) return;
    if (this.idleTransition < 1) return;

    const current = this.idleLowerActions[this.activeIdleIndex];
    const remaining = current.getClip().duration - current.time;
    if (remaining <= AnimationConfig.idle.transitionLeadTime)
      this.beginIdleTransition();
  }
  private updateIdleTransition(delta: number): void {
    if (this.previousIdleIndex === null || this.nextIdleIndex === null) return;

    this.idleTransition += delta / AnimationConfig.idle.crossfadeDuration;
    const t = THREE.MathUtils.clamp(this.idleTransition, 0, 1);
    const previousLower = this.idleLowerActions[this.previousIdleIndex];
    const nextLower = this.idleLowerActions[this.nextIdleIndex];

    previousLower.setEffectiveWeight(1 - t);
    nextLower.setEffectiveWeight(t);

    const previousUpper = this.idleUpperActions[this.previousIdleIndex];
    const nextUpper = this.idleUpperActions[this.nextIdleIndex];
    previousUpper?.setEffectiveWeight(1 - t);
    nextUpper?.setEffectiveWeight(t);

    if (t >= 1) {
      previousLower.stop();
      previousUpper?.stop();

      this.activeIdleIndex = this.nextIdleIndex;

      this.previousIdleIndex = null;
      this.nextIdleIndex = null;
      this.idleTransition = 1;
    }
  }
  public update(state: CharacterState, delta: number): void {
    this.verticalStateAge += delta;

    const verticalState = this.resolveVerticalState(state, delta);
    this.setVerticalState(state, verticalState);

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

    this.checkIdleReset(state, verticalState);
    this.checkIdleTransition(state);
    this.updateIdleTransition(delta);
    this.updateLocomotionWeights(state, delta);
    this.syncLocomotionPhases();
    this.updatePlaybackRate(state.horizontalSpeed, delta);
    this.updateFullBodyActions(delta);

    this.mixer.update(delta);
  }
  private getJumpVariant(state: CharacterState): JumpVariant {
    return state.horizontalSpeed > AnimationConfig.vertical.jumpMoveThreshold
      ? "Move"
      : "Idle";
  }
}
