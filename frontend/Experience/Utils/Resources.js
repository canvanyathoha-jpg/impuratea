import Loaders from "./Loaders.js";
import { EventEmitter } from "events";
import * as THREE from "three";
import SceneManager from "./SceneManager.js";

export default class Resources extends EventEmitter {
    constructor(assets) {
        super();

        this.items = {};
        this.assets = assets;
        this.isReady = false;
        // Get scene from URL parameter or default to westgate
        this.currentScene = SceneManager.getSceneFromURL();

        console.log(`[Resources] Current scene: ${this.currentScene}`);
        console.log(`[Resources] Assets to load:`, this.assets[0][this.currentScene]);

        this.loaders = new Loaders().loaders;

        this.startLoading();
    }

    startLoading() {
        this.loaded = 0;
        this.queue = this.assets[0][this.currentScene].assets.length;

        for (const asset of this.assets[0][this.currentScene].assets) {
            if (asset.type === "glbModel") {
                this.loaders.gltfLoader.load(asset.path, (file) => {
                    this.singleAssetLoaded(asset, file);
                });
            } else if (asset.type === "imageTexture") {
                this.loaders.textureLoader.load(asset.path, (file) => {
                    this.singleAssetLoaded(asset, file);
                });
            } else if (asset.type === "cubeTexture") {
                this.loaders.cubeTextureLoader.load(asset.path, (file) => {
                    this.singleAssetLoaded(asset, file);
                });
            } else if (asset.type === "videoTexture") {
                this.video = {};
                this.videoTexture = {};

                this.video[asset.name] = document.createElement("video");
                this.video[asset.name].src = asset.path;
                this.video[asset.name].muted = true;
                this.video[asset.name].playsInline = true;
                this.video[asset.name].autoplay = true;
                this.video[asset.name].loop = true;
                this.video[asset.name].play();

                this.videoTexture[asset.name] = new THREE.VideoTexture(
                    this.video[asset.name]
                );
                this.videoTexture[asset.name].flipY = false;
                this.videoTexture[asset.name].minFilter = THREE.NearestFilter;
                this.videoTexture[asset.name].magFilter = THREE.NearestFilter;
                this.videoTexture[asset.name].generateMipmaps = false;
                this.videoTexture[asset.name].ColorSpace = THREE.SRGBColorSpace; //changed

                this.singleAssetLoaded(asset, this.videoTexture[asset.name]);
            }
        }
    }

    singleAssetLoaded(asset, file) {
        this.items[asset.name] = file;
        this.loaded++;
        console.log(`[Resources] Loaded ${this.loaded}/${this.queue}: ${asset.name}`);
        this.emit("loading", this.loaded, this.queue);

        if (this.loaded === this.queue) {
            console.log(`[Resources] All assets loaded! Emitting 'ready' event.`);
            this.isReady = true;
            this.emit("ready");
        }
    }
}
