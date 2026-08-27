import RAPIER from "@dimforge/rapier3d-compat";

import Game from "./core/Game";

async function main(): Promise<void> {
  await RAPIER.init();

  const game = new Game();
  await game.init();
}

main();
