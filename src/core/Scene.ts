import * as THREE from "three";

import GameConfig from "../config/GameConfig";
import enableLightShadow from "../utils/enableLightShadow";

export default class Scene {
  public readonly instance: THREE.Scene;
  public readonly keyLight: THREE.DirectionalLight;
  constructor() {
    this.instance = new THREE.Scene();
    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.5);

    this.init();
  }
  private init(): void {
    this.instance.background = new THREE.Color(0x1a1c23);

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x444444, 0.6);
    this.instance.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.instance.add(ambientLight);

    const position = GameConfig.lighting.keyLight.position;
    this.keyLight.position.set(position.x, position.y, position.z);
    this.instance.add(this.keyLight);
    enableLightShadow({ light: this.keyLight });
  }
}
