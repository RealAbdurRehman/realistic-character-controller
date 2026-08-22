import * as THREE from "three";

import { GameConfig } from "../config/GameConfig";

export default class Camera {
  public readonly instance: THREE.PerspectiveCamera;
  constructor() {
    this.instance = new THREE.PerspectiveCamera(
      GameConfig.camera.fov,
      window.innerWidth / window.innerHeight,
      GameConfig.camera.near,
      GameConfig.camera.far,
    );

    this.init();
  }
  private init(): void {
    this.instance.position.z = 10;
    this.instance.position.y = 5;
    this.instance.lookAt(new THREE.Vector3());
  }
  public resize(): void {
    this.instance.aspect = window.innerWidth / window.innerHeight;
    this.instance.updateProjectionMatrix();
  }
}
