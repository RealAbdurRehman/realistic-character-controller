import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

import CharacterController from "./CharacterController";
import CharacterModel from "./model/CharacterModel";
import type CharacterInput from "./CharacterInput";

export default class Character {
  private readonly controller: CharacterController;
  private readonly model: CharacterModel;
  constructor(
    scene: THREE.Scene,
    world: RAPIER.World,
    position: THREE.Vector3,
    modelGltfScene?: THREE.Group,
    animations?: THREE.AnimationClip[],
  ) {
    this.controller = new CharacterController(world, position);
    this.model = new CharacterModel(scene, modelGltfScene, animations);
  }
  public fixedUpdate(input: CharacterInput, delta: number): void {
    this.controller.fixedUpdate(input, delta);
  }
  public update(alpha: number, delta: number): void {
    const state = this.controller.getState();
    const position = this.controller.getInterpolatedPosition(alpha);
    const rotation = this.controller.getInterpolatedRotation(alpha);
    this.model.update(position, rotation, state, delta);
  }
  public getInterpolatedPosition(alpha: number): THREE.Vector3 {
    return this.controller.getInterpolatedPosition(alpha);
  }
}
