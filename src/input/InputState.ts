import * as THREE from "three";

export default interface InputState {
  direction: THREE.Vector2;
  sprinting: boolean;
  jumping: boolean;
  crouching: boolean;
}
