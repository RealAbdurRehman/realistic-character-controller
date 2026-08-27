import * as THREE from "three";
import { SkeletonUtils } from "three/examples/jsm/Addons.js";

import CharacterConfig from "./CharacterConfig";
import enableObjectShadow from "../utils/enableObjectShadow";
import enableModelShadow from "../utils/enableModelShadow";

export default class CharacterModel {
  private crouchAmount = 0;
  private modelRoot: THREE.Group | null = null;

  private readonly crouchSpeed = 12;
  public readonly instance: THREE.Group;
  constructor(scene: THREE.Scene, gltfScene?: THREE.Group) {
    this.instance = new THREE.Group();
    scene.add(this.instance);

    if (gltfScene) this.setModel(gltfScene);
    else this.createFallbackMesh();
  }
  private createFallbackMesh(): void {
    const geometry = new THREE.CapsuleGeometry(
      CharacterConfig.collider.radius,
      CharacterConfig.collider.standingHalfHeight * 2,
    );
    const material = new THREE.MeshStandardMaterial({ color: 0x2266cc });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.name = "fallback_mesh";
    enableObjectShadow({ object: mesh });

    this.instance.add(mesh);
  }
  public setModel(gltfScene: THREE.Group): void {
    const fallback = this.instance.getObjectByName("fallback_mesh");
    if (fallback) this.instance.remove(fallback);

    this.modelRoot = SkeletonUtils.clone(gltfScene) as THREE.Group;
    this.modelRoot.scale.setScalar(CharacterConfig.model.scale);
    enableModelShadow({ model: this.modelRoot });

    const feetOffset = -(
      CharacterConfig.collider.standingHalfHeight +
      CharacterConfig.collider.radius
    );
    this.modelRoot.position.set(0, feetOffset, 0);

    this.instance.add(this.modelRoot);
  }
  public update(
    position: THREE.Vector3,
    rotation: THREE.Quaternion,
    crouched: boolean,
    delta: number,
  ): void {
    this.instance.position.copy(position);
    this.instance.quaternion.copy(rotation);

    const target = crouched ? 1 : 0;
    this.crouchAmount = THREE.MathUtils.lerp(
      this.crouchAmount,
      target,
      1 - Math.exp(-this.crouchSpeed * delta),
    );

    const heightScale = THREE.MathUtils.lerp(1, 0.65, this.crouchAmount);
    this.instance.scale.y = heightScale;
  }
}
