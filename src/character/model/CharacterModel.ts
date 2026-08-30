import * as THREE from "three";
import { SkeletonUtils } from "three/examples/jsm/Addons.js";

import CharacterConfig from "../CharacterConfig";
import enableObjectShadow from "../../utils/enableObjectShadow";
import enableModelShadow from "../../utils/enableModelShadow";

import type CharacterState from "../CharacterState";
import CharacterAnimator from "../animation/CharactorAnimator";

export default class CharacterModel {
  private isFirstUpdate = true;

  private smoothedY = 0;
  private modelRoot: THREE.Group | null = null;
  private animator: CharacterAnimator | null = null;

  public readonly instance: THREE.Group;
  constructor(
    scene: THREE.Scene,
    gltfScene?: THREE.Group,
    animations?: THREE.AnimationClip[],
  ) {
    this.instance = new THREE.Group();
    scene.add(this.instance);

    if (gltfScene) this.setModel(gltfScene, animations);
    else this.createFallbackMesh();
  }
  public setModel(
    gltfScene: THREE.Group,
    animations?: THREE.AnimationClip[],
  ): void {
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

    if (animations && animations.length > 0)
      this.animator = new CharacterAnimator(this.modelRoot, animations);
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
  public update(
    position: THREE.Vector3,
    rotation: THREE.Quaternion,
    state: CharacterState,
    delta: number,
  ): void {
    if (this.isFirstUpdate) {
      this.smoothedY = position.y;
      this.isFirstUpdate = false;
    }

    this.smoothedY = THREE.MathUtils.lerp(
      this.smoothedY,
      position.y,
      1 - Math.exp(-12 * delta),
    );

    this.instance.position.set(position.x, this.smoothedY, position.z);
    this.instance.quaternion.copy(rotation);

    if (this.animator) this.animator.update(state, delta);
  }
}
