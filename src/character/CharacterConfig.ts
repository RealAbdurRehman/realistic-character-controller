const CharacterConfig = {
  movement: { speed: 5, sprintSpeed: 8, acceleration: 8, deceleration: 10 },
  force: { jump: 6 },
  slope: {
    maxClimbAngle: 45,
    minSlideAngle: 30,
  },
  controller: {
    offset: 0.01,
    autostep: {
      maxHeight: 0.5,
      minWidth: 0.2,
    },
    snapToGround: 0.5,
  },
} as const;

export default CharacterConfig;
