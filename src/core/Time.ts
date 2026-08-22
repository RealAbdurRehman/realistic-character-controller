export default class Time {
  private _delta = 0;
  private _elapsed = 0;
  private _accumulator = 0;
  private lastTime = 0;

  private readonly fixedDelta = 1 / 60;
  public update(timestamp: number): void {
    if (this.lastTime <= 0) {
      this.lastTime = timestamp;
      return;
    }

    this._delta = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this._elapsed += this._delta;
    this._accumulator += this._delta;
  }
  public consumeFixedStep(): boolean {
    if (this._accumulator < this.fixedDelta) return false;

    this._accumulator -= this.fixedDelta;
    return true;
  }
  public get delta(): number {
    return this._delta;
  }
  public get elapsed(): number {
    return this._elapsed;
  }
}
