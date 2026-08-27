import * as THREE from "three";

interface EnableObjectShadowOptions {
  object: THREE.Mesh;
  shouldCast?: boolean;
  shouldReceive?: boolean;
}

export default function enableObjectShadow({
  object,
  shouldCast = true,
  shouldReceive = true,
}: EnableObjectShadowOptions): void {
  object.castShadow = shouldCast;
  object.receiveShadow = shouldReceive;
}
