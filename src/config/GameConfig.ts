import * as THREE from "three";

const GameConfig = {
  assets: {
    models: {
      player: "/models/player/player.glb",
    },
  },
  camera: {
    fov: 60,
    near: 0.1,
    far: 1000,
    sensitivity: 0.002,
    height: 2,
    distance: 4,
    verticalSpeed: 6,
  },
  lighting: { keyLight: { position: { x: 4, y: 25, z: 5 } } },
  physics: { gravity: new THREE.Vector3(0, -20, 0) },
  debug: { physics: false },
  spawn: {
    player: new THREE.Vector3(0, 2, 0),
  },
} as const;

export default GameConfig;
