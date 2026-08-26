import * as THREE from "three";

export default class CharacterModel {
  private crouchAmount = 0;
  private readonly crouchSpeed = 12;
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
  public update(
    position: THREE.Vector3,
    facing: THREE.Vector3,
    crouched: boolean,
    delta: number,
  ): void {
    const target = crouched ? 1 : 0;
    this.crouchAmount = THREE.MathUtils.lerp(
      this.crouchAmount,
      target,
      1 - Math.exp(-this.crouchSpeed * delta),
    );

    const heightScale = THREE.MathUtils.lerp(1, 0.65, this.crouchAmount);
    this.instance.scale.y = heightScale;

    this.instance.position.copy(position);
    this.instance.rotation.y = Math.atan2(facing.x, facing.z);
  }
}
