import * as THREE from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

export default class Loaders {
    constructor() {
        this.loaders = {};

        this.setLoaders();
    }

    setLoaders() {
        this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader();

        // Setup texture path untuk teacher model textures menggunakan LoadingManager
        const loaderManager = new THREE.LoadingManager();
        loaderManager.setURLModifier((url) => {
            // Jika texture dimuat dari folder teacher/textures, arahkan ke lokasi yang benar
            if (url.includes('gltf_embedded_') || url.includes('textures/')) {
                const textureName = url.split('/').pop();
                return `/models/${textureName}`;
            }
            return url;
        });

        // Pass LoadingManager ke GLTFLoader constructor
        this.loaders.gltfLoader = new GLTFLoader(loaderManager);
        this.loaders.dracoLoader = new DRACOLoader();
        this.loaders.dracoLoader.setDecoderPath("/draco/");
        this.loaders.gltfLoader.setDRACOLoader(this.loaders.dracoLoader);

        this.loaders.textureLoader = new THREE.TextureLoader();
    }
}
