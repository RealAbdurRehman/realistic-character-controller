import * as THREE from "three";

import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js";
import { DRACOLoader } from "three/examples/jsm/Addons.js";

export default class AssetLoader {
  private readonly manager: THREE.LoadingManager;
  private readonly gltfLoader: GLTFLoader;
  private readonly dracoLoader: DRACOLoader;
  constructor(onProgress?: (progress: number) => void, onLoad?: () => void) {
    this.manager = new THREE.LoadingManager();

    if (onProgress)
      this.manager.onProgress = (_, itemsLoaded, itemsTotal) =>
        onProgress(itemsLoaded / itemsTotal);

    if (onLoad) this.manager.onLoad = onLoad;

    this.dracoLoader = new DRACOLoader(this.manager);
    this.dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.7/",
    );

    this.gltfLoader = new GLTFLoader(this.manager);
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
  }
  public loadGLTF(url: string): Promise<GLTF> {
    return new Promise((resolve, reject) =>
      this.gltfLoader.load(
        url,
        (gltf) => resolve(gltf),
        undefined,
        (err) => reject(err),
      ),
    );
  }
}
