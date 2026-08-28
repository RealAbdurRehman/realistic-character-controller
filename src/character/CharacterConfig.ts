const CharacterConfig = {
  movement: {
    speed: 5,
    sprintSpeed: 8,
    rotationSpeed: 6,
    acceleration: 8,
    deceleration: 10,
    restVelocityThreshold: 0.05,
    crouchMultiplier: 0.5,
  },
  crouch: { halfHeight: 0.5 },
  jump: { force: 8 },
  slope: {
    maxClimbAngle: 45,
    minSlideAngle: 30,
  },
  collider: { radius: 0.5, standingHalfHeight: 1 },
  controller: {
    offset: 0.01,
    autostep: { maxHeight: 0.5, minWidth: 0.2 },
    snapToGround: 0.1,
  },
  model: {
    scale: 1.67,
  },
} as const;

export default CharacterConfig;
