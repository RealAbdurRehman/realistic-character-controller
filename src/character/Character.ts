import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

import CharacterController from "./CharacterController";
import CharacterModel from "./CharacterModel";
import type CharacterInput from "./CharacterInput";

export default class Character {
  private readonly controller: CharacterController;
  private readonly model: CharacterModel;
  constructor(
    scene: THREE.Scene,
    world: RAPIER.World,
    position: THREE.Vector3,
  ) {
    this.controller = new CharacterController(world, position);
    this.model = new CharacterModel(scene);
  }
  public fixedUpdate(input: CharacterInput, delta: number): void {
    this.controller.fixedUpdate(input, delta);
  }
  public update(alpha: number, forward: THREE.Vector3, delta: number): void {
    const state = this.controller.getState();
    const position = this.controller.getInterpolatedPosition(alpha);
    this.model.update(position, forward, state.isCrouched, delta);
  }
  public getInterpolatedPosition(alpha: number): THREE.Vector3 {
    return this.controller.getInterpolatedPosition(alpha);
  }
}
