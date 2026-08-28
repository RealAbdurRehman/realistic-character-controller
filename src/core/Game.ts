import Scene from "./Scene";
import Camera from "../camera/Camera";
import CameraController from "../camera/CameraController";
import Renderer from "./Renderer";

import Time from "./Time";
import PhysicsWorld from "../physics/PhysicsWorld";
import PhysicsDebug from "../debug/PhysicsDebug";

import Ground from "../environment/Ground";
import TestEnvironment from "../environment/TestEnvironment";
import ShadowController from "../environment/ShadowController";

import Input from "../input/Input";
import Character from "../character/Character";
import type CharacterInput from "../character/CharacterInput";

import GameConfig from "../config/GameConfig";

import AssetLoader from "../loaders/AssetLoader";
import LoadingScreen from "../ui/LoadingScreen";

export default class Game {
  private readonly loadingScreen: LoadingScreen;

  private readonly scene: Scene;
  private readonly camera: Camera;
  private readonly renderer: Renderer;
  private readonly cameraController: CameraController;

  private readonly time: Time;
  private readonly physics: PhysicsWorld;
  private readonly physicsDebug: PhysicsDebug;

  private readonly input: Input;

  private readonly shadowController: ShadowController;

  private character!: Character;
  constructor() {
    this.loadingScreen = new LoadingScreen();

    this.scene = new Scene();
    this.camera = new Camera();
    this.renderer = new Renderer();
    this.cameraController = new CameraController(this.camera);

    this.time = new Time();
    this.physics = new PhysicsWorld();
    this.physicsDebug = new PhysicsDebug(
      this.scene.instance,
      this.physics.instance,
    );

    this.input = new Input();

    new Ground(this.scene.instance, this.physics.instance);
    new TestEnvironment(this.scene.instance, this.physics.instance);
    this.shadowController = new ShadowController(this.scene.keyLight);

    this.addEventListeners();
  }
  public async init(): Promise<void> {
    const loader = new AssetLoader(
      (progress) => this.loadingScreen.update(progress),
      () => this.loadingScreen.hide(),
    );

    const characterGltf = await loader.loadGLTF(
      GameConfig.assets.models.player,
    );

    this.character = new Character(
      this.scene.instance,
      this.physics.instance,
      GameConfig.spawn.player.clone(),
      characterGltf.scene,
      characterGltf.animations,
    );

    requestAnimationFrame(this.animate);
  }
  private render(): void {
    this.renderer.render(this.scene.instance, this.camera.instance);
  }
  private update(): void {
    const position = this.character.getInterpolatedPosition(this.time.alpha);

    this.shadowController.update(position);
    this.cameraController.update(position, this.time.delta);
    this.character.update(this.time.alpha, this.time.delta);

    this.physicsDebug.update();
    this.input.update();
  }
  private fixedUpdate(): void {
    const input = this.input.getInput();
    const movement = this.cameraController.getMovementDirection(
      input.direction,
    );

    const characterInput: CharacterInput = {
      direction: movement,
      sprinting: input.sprinting,
      jumping: input.jumping,
      crouching: input.crouching,
    };
    this.character.fixedUpdate(characterInput, this.time.fixedDelta);

    this.physics.step();
  }
  private animate = (timestamp: number): void => {
    requestAnimationFrame(this.animate);

    this.time.update(timestamp);
    while (this.time.consumeFixedStep()) this.fixedUpdate();

    this.update();
    this.render();
  };
  private resize = (): void => {
    this.camera.resize();
    this.renderer.resize();
  };
  private addEventListeners(): void {
    window.addEventListener("resize", this.resize);
    document.body.addEventListener("click", () =>
      document.body.requestPointerLock(),
    );
  }
}
