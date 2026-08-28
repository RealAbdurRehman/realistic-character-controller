import * as THREE from "three";

import GameConfig from "../config/GameConfig";

export default class ShadowController {
  private readonly light: THREE.DirectionalLight;
  constructor(light: THREE.DirectionalLight) {
    this.light = light;
  }
  public update(target: THREE.Vector3): void {
    const offset = GameConfig.lighting.keyLight.position;
    this.light.position.set(target.x + offset.x, offset.y, target.z + offset.z);
    this.light.target.position.set(target.x, 0, target.z);
    this.light.target.updateMatrixWorld();
  }
}
