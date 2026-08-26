import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

export default class TestEnvironment {
  constructor(scene: THREE.Scene, world: RAPIER.World) {
    this.createSlope(scene, world);
    this.createStairs(scene, world);
    this.createStep(scene, world);
    this.createWall(scene, world);
    this.createCeilingArea(scene, world);
    this.createCrouchingArea(scene, world);
  }
  private createBox(
    scene: THREE.Scene,
    world: RAPIER.World,
    position: THREE.Vector3,
    size: THREE.Vector3,
    rotation?: THREE.Euler,
  ): void {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshStandardMaterial();
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.copy(position);
    if (rotation) mesh.rotation.copy(rotation);

    scene.add(mesh);

    const rigidBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(
        position.x,
        position.y,
        position.z,
      ),
    );

    if (rotation) {
      const quaternion = new THREE.Quaternion().setFromEuler(rotation);
      rigidBody.setRotation(
        {
          x: quaternion.x,
          y: quaternion.y,
          z: quaternion.z,
          w: quaternion.w,
        },
        true,
      );
    }

    const collider = RAPIER.ColliderDesc.cuboid(
      size.x / 2,
      size.y / 2,
      size.z / 2,
    );

    world.createCollider(collider, rigidBody);
  }
  private createSlope(scene: THREE.Scene, world: RAPIER.World): void {
    this.createBox(
      scene,
      world,
      new THREE.Vector3(6, 1, 0),
      new THREE.Vector3(4, 1, 14),
      new THREE.Euler(Math.PI * 0.15, 0, 0),
    );
  }
  private createStairs(scene: THREE.Scene, world: RAPIER.World): void {
    const stepCount = 8;
    const stepHeight = 0.35;
    const stepDepth = 0.6;
    const stepWidth = 3;

    for (let i = 0; i < stepCount; i++) {
      const height = stepHeight * (i + 1);
      this.createBox(
        scene,
        world,
        new THREE.Vector3(-5, height / 2, -i * stepDepth),
        new THREE.Vector3(stepWidth, height, stepDepth),
      );
    }
  }
  private createStep(scene: THREE.Scene, world: RAPIER.World): void {
    this.createBox(
      scene,
      world,
      new THREE.Vector3(0, 0.25, -5),
      new THREE.Vector3(3, 0.5, 1),
    );
  }
  private createWall(scene: THREE.Scene, world: RAPIER.World): void {
    this.createBox(
      scene,
      world,
      new THREE.Vector3(0, 1.5, 5),
      new THREE.Vector3(5, 3, 0.5),
    );
  }
  private createCeilingArea(scene: THREE.Scene, world: RAPIER.World): void {
    const ceilingHeight = 3.75;
    this.createBox(
      scene,
      world,
      new THREE.Vector3(0, ceilingHeight, -15),
      new THREE.Vector3(6, 0.5, 6),
    );
  }
  private createCrouchingArea(scene: THREE.Scene, world: RAPIER.World): void {
    const ceilingHeight = 2.6;
    this.createBox(
      scene,
      world,
      new THREE.Vector3(8, ceilingHeight, -15),
      new THREE.Vector3(6, 0.5, 6),
    );
  }
}
