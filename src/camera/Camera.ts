import * as THREE from "three";

import GameConfig from "../config/GameConfig";

export default class Camera {
  public readonly instance: THREE.PerspectiveCamera;
  constructor() {
    this.instance = new THREE.PerspectiveCamera(
      GameConfig.camera.fov,
      window.innerWidth / window.innerHeight,
      GameConfig.camera.near,
      GameConfig.camera.far,
    );
  }
  public resize(): void {
    this.instance.aspect = window.innerWidth / window.innerHeight;
    this.instance.updateProjectionMatrix();
  }
}
