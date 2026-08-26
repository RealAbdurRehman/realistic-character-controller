const InputConfig = {
  movement: {
    forward: "KeyW",
    backward: "KeyS",
    left: "KeyA",
    right: "KeyD",
  },
  sprint: "ShiftLeft",
  jump: "Space",
  crouch: "ControlLeft",
} as const;

export default InputConfig;
