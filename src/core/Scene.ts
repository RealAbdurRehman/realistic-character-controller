import * as THREE from "three";

export default class Scene {
  public readonly instance: THREE.Scene;
  constructor() {
    this.instance = new THREE.Scene();
    this.init();
  }
  private init(): void {
    this.instance.background = new THREE.Color(0x111111);

    const ambientLight = new THREE.AmbientLight(0x101525, 0.15);
    this.instance.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x6f8cff, 1.8);
    keyLight.position.set(4, 6, 5);
    this.instance.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x9b6cff, 2.0);
    rimLight.position.set(-5, 2, -6);
    this.instance.add(rimLight);
  }
}
