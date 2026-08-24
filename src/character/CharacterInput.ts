import * as THREE from "three";

export default interface CharacterInput {
  direction: THREE.Vector3;
  sprinting: boolean;
}
