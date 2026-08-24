import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

export default class Ground {
  constructor(scene: THREE.Scene, world: RAPIER.World) {
    this.createMesh(scene);
    this.createCollider(world);
  }
  private createMesh(scene: THREE.Scene): void {
    const geometry = new THREE.BoxGeometry(40, 0.5, 40);
    const material = new THREE.MeshStandardMaterial({ color: 0x7c9818 });
    const mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);
  }
  private createCollider(world: RAPIER.World): void {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const collider = RAPIER.ColliderDesc.cuboid(20, 0.25, 20);

    world.createCollider(collider, body);
  }
}
