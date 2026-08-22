import Scene from "./Scene";
import Camera from "./Camera";
import Renderer from "./Renderer";

import Time from "./Time";
import PhysicsWorld from "../physics/PhysicsWorld";

export default class Game {
  private readonly scene: Scene;
  private readonly camera: Camera;
  private readonly renderer: Renderer;

  private readonly time: Time;
  private readonly physics: PhysicsWorld;
  constructor() {
    this.scene = new Scene();
    this.camera = new Camera();
    this.renderer = new Renderer();

    this.time = new Time();
    this.physics = new PhysicsWorld();

    this.addEventListeners();
  }
  private render(): void {
    this.renderer.render(this.scene.instance, this.camera.instance);
  }
  private update(): void {
    // Something happens...
  }
  private fixedUpdate(): void {
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
    requestAnimationFrame(this.animate);
  }
}
