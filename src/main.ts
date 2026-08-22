import RAPIER from "@dimforge/rapier3d-compat";
import Game from "./core/Game";

await RAPIER.init();

const game = new Game();

game.init();
