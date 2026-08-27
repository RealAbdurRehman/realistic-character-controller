import * as THREE from "three";

interface EnableModelShadowOptions {
  model: THREE.Object3D;
  shouldCast?: boolean;
  shouldReceive?: boolean;
}

export default function enableModelShadow({
  model,
  shouldCast = true,
  shouldReceive = true,
}: EnableModelShadowOptions): void {
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = shouldCast;
      child.receiveShadow = shouldReceive;
    }
  });
}
