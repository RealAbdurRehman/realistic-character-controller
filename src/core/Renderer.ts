import * as THREE from "three";

export default class Renderer {
  public readonly instance: THREE.WebGLRenderer;
  constructor() {
    this.instance = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      precision: "highp",
    });

    this.init();
  }
  private init(): void {
    this.instance.outputColorSpace = THREE.SRGBColorSpace;
    this.instance.toneMapping = THREE.ACESFilmicToneMapping;
    this.instance.toneMappingExposure = 1.2;
    this.instance.shadowMap.enabled = true;
    this.instance.shadowMap.type = THREE.PCFShadowMap;
    this.instance.setSize(window.innerWidth, window.innerHeight);
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const container = document.getElementById("app")!;
    container.appendChild(this.instance.domElement);
  }
  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.instance.setSize(width, height);
  }
  public render(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.instance.render(scene, camera);
  }
}
