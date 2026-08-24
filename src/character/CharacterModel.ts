import * as THREE from "three";

export default class CharacterModel {
  public readonly instance: THREE.Mesh;
  constructor(scene: THREE.Scene) {
    this.instance = this.createInstance();
    scene.add(this.instance);
  }
  private createInstance(): THREE.Mesh {
    const geometry = new THREE.CapsuleGeometry(0.5, 2);
    const material = new THREE.MeshStandardMaterial();
    return new THREE.Mesh(geometry, material);
  }
  public update(position: THREE.Vector3, forward: THREE.Vector3): void {
    this.instance.position.copy(position);
    this.instance.rotation.y = Math.atan2(forward.x, forward.z);
  }
}
