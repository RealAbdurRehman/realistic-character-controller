import Scene from "./Scene";
import Camera from "./Camera";
import Renderer from "./Renderer";

import Time from "./Time";
import PhysicsWorld from "../physics/PhysicsWorld";
import PhysicsDebug from "../debug/PhysicsDebug";

import Ground from "../environment/ground";

import Input from "../input/Input";
import CharacterController from "../character/CharacterController";

export default class Game {
  private readonly scene: Scene;
  private readonly camera: Camera;
  private readonly renderer: Renderer;

  private readonly time: Time;
  private readonly physics: PhysicsWorld;
  private readonly physicsDebug: PhysicsDebug;

  private readonly ground: Ground;

  private readonly input: Input;
  private readonly character: CharacterController;
  constructor() {
    this.scene = new Scene();
    this.camera = new Camera();
    this.renderer = new Renderer();

    this.time = new Time();
    this.physics = new PhysicsWorld();
    this.physicsDebug = new PhysicsDebug(
      this.scene.instance,
      this.physics.instance,
    );

    this.ground = new Ground(this.scene.instance, this.physics.instance);

    this.input = new Input();
    this.character = new CharacterController(this.physics.instance);

    this.addEventListeners();
  }
  private render(): void {
    this.renderer.render(this.scene.instance, this.camera.instance);
  }
  private update(): void {
    this.physicsDebug.update();
  }
  private fixedUpdate(): void {
    this.character.fixedUpdate(this.input.getDirection(), this.time.fixedDelta);
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
  }
  public init(): void {
    console.log(this.ground);
    requestAnimationFrame(this.animate);
  }
}
