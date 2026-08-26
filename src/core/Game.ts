import Scene from "./Scene";
import Camera from "../camera/Camera";
import CameraController from "../camera/CameraController";
import Renderer from "./Renderer";

import Time from "./Time";
import PhysicsWorld from "../physics/PhysicsWorld";
import PhysicsDebug from "../debug/PhysicsDebug";

import Ground from "../environment/Ground";
import TestEnvironment from "../environment/TestEnvironment";

import Input from "../input/Input";
import Character from "../character/Character";
import type CharacterInput from "../character/CharacterInput";

import GameConfig from "../config/GameConfig";

export default class Game {
  private readonly scene: Scene;
  private readonly camera: Camera;
  private readonly cameraController: CameraController;
  private readonly renderer: Renderer;

  private readonly time: Time;
  private readonly physics: PhysicsWorld;
  private readonly physicsDebug: PhysicsDebug;

  private readonly ground: Ground;
  private readonly testEnvironment: TestEnvironment;

  private readonly input: Input;
  private readonly character: Character;
  constructor() {
    this.scene = new Scene();
    this.camera = new Camera();
    this.cameraController = new CameraController(this.camera);
    this.renderer = new Renderer();

    this.time = new Time();
    this.physics = new PhysicsWorld();
    this.physicsDebug = new PhysicsDebug(
      this.scene.instance,
      this.physics.instance,
    );

    this.ground = new Ground(this.scene.instance, this.physics.instance);
    this.testEnvironment = new TestEnvironment(
      this.scene.instance,
      this.physics.instance,
    );

    this.input = new Input();
    this.character = new Character(
      this.scene.instance,
      this.physics.instance,
      GameConfig.spawn.player,
    );

    this.addEventListeners();
  }
  private render(): void {
    this.renderer.render(this.scene.instance, this.camera.instance);
  }
  private update(): void {
    const position = this.character.getInterpolatedPosition(this.time.alpha);

    this.cameraController.update(position);
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
  public init(): void {
    console.log(this.ground);
    console.log(this.testEnvironment);
    requestAnimationFrame(this.animate);
  }
}
