import * as THREE from "three";

const GameConfig = {
  camera: {
    fov: 60,
    near: 0.1,
    far: 1000,
    sensitivity: 0.002,
    height: 2,
    distance: 6,
  },
  physics: { gravity: new THREE.Vector3(0, -9.81, 0) },
  debug: { physics: false },
  spawn: {
    player: new THREE.Vector3(0, 2, 0),
  },
} as const;

export default GameConfig;
