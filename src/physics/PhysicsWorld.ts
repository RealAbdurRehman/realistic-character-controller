import RAPIER from "@dimforge/rapier3d-compat";

import { GameConfig } from "../config/GameConfig";

export default class PhysicsWorld {
  public readonly world: RAPIER.World;
  constructor() {
    this.world = new RAPIER.World(
      new RAPIER.Vector3(
        GameConfig.physics.gravity.x,
        GameConfig.physics.gravity.y,
        GameConfig.physics.gravity.z,
      ),
    );
  }
  public step(): void {
    this.world.step();
  }
}
