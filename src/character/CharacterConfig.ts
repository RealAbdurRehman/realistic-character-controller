const CharacterConfig = {
  movement: {
    speed: 3.2,
    crouchMultiplier: 0.42,
    acceleration: 3.5,
    deceleration: 5.0,
    airAccelerationMultiplier: 0.32,
    airDecelerationMultiplier: 0.22,
    sprintSpeed: 6.4,
    rotationSpeed: 3.0,
    restVelocityThreshold: 0.05,
    turnResistance: { aligned: 1.0, opposite: 0.6 },
    terminalFallSpeed: 18,
  },
  crouch: { halfHeight: 0.5 },
  jump: { force: 7.2, cooldown: 0.15 },
  slope: { maxClimbAngle: 45, minSlideAngle: 30 },
  collider: { radius: 0.5, standingHalfHeight: 1 },
  controller: {
    offset: 0.01,
    autostep: { maxHeight: 0.5, minWidth: 0.2 },
    snapToGround: 0.1,
  },
  model: { scale: 1.67 },
} as const;

export default CharacterConfig;
