export default class LoadingScreen {
  private readonly element: HTMLElement | null;
  private readonly fill: HTMLElement | null;
  private readonly text: HTMLElement | null;
  constructor() {
    this.element = document.getElementById("loading-screen");
    this.fill = document.getElementById("progress-bar-fill");
    this.text = document.getElementById("loading-text");
  }
  public update(progress: number): void {
    const percentage = Math.round(progress * 100);
    if (this.fill) this.fill.style.width = `${percentage}%`;
    if (this.text) this.text.textContent = `${percentage}%`;
  }
  public hide(): void {
    if (this.element) this.element.classList.add("hidden");
  }
}
