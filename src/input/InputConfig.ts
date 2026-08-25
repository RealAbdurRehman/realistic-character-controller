const InputConfig = {
  movement: {
    forward: "KeyW",
    backward: "KeyS",
    left: "KeyA",
    right: "KeyD",
  },
  sprint: "ShiftLeft",
  jump: "Space",
} as const;

export default InputConfig;
