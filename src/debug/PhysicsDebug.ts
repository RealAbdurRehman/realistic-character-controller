import * as THREE from "three";

import RAPIER from "@dimforge/rapier3d-compat";
import { RapierHelper } from "three/addons/helpers/RapierHelper.js";

import GameConfig from "../config/GameConfig";

export default class PhysicsDebug {
  private readonly instance: RapierHelper;
  constructor(scene: THREE.Scene, world: RAPIER.World) {
    this.instance = new RapierHelper(world);
    this.instance.visible = GameConfig.debug.physics;

    scene.add(this.instance);
  }
  public update(): void {
    this.instance.update();
  }
}
