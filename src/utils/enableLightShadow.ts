import * as THREE from "three";

interface EnableLightShadowOptions {
  light: THREE.DirectionalLight;
  far?: number;
  mapSize?: {
    width: number;
    height: number;
  };
  d?: number;
}

export default function enableLightShadow({
  light,
  far = 2000,
  mapSize = { width: 4096, height: 4096 },
  d = 20,
}: EnableLightShadowOptions): void {
  light.castShadow = true;

  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = far;
  light.shadow.mapSize.set(mapSize.width, mapSize.height);

  light.shadow.camera.top = d;
  light.shadow.camera.right = d;
  light.shadow.camera.bottom = -d;
  light.shadow.camera.left = -d;
}
