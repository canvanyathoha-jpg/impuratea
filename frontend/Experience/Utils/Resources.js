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
                this.loaders.gltfLoader.load(
                    asset.path,
                    (file) => {
                        this.singleAssetLoaded(asset, file);
                    },
                    (progress) => {
                        // Progress callback - optional
                        console.log(`[Resources] Loading ${asset.name}: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
                    },
                    (error) => {
                        // Error callback - handle missing files or loading errors
                        console.error(`[Resources] ❌ Error loading ${asset.name} from ${asset.path}:`, error);
                        console.error(`[Resources] Error details:`, error.message || error);
                        // Skip this asset and continue loading others
                        // Set a placeholder or mark as failed
                        this.items[asset.name] = null;
                        this.singleAssetLoaded(asset, null);
                    }
                );
            } else if (asset.type === "imageTexture") {
                this.loaders.textureLoader.load(
                    asset.path,
                    (file) => {
                        this.singleAssetLoaded(asset, file);
                    },
                    undefined,
                    (error) => {
                        console.error(`[Resources] ❌ Error loading texture ${asset.name} from ${asset.path}:`, error);
                        this.items[asset.name] = null;
                        this.singleAssetLoaded(asset, null);
                    }
                );
            } else if (asset.type === "cubeTexture") {
                this.loaders.cubeTextureLoader.load(
                    asset.path,
                    (file) => {
                        this.singleAssetLoaded(asset, file);
                    },
                    undefined,
                    (error) => {
                        console.error(`[Resources] ❌ Error loading cube texture ${asset.name} from ${asset.path}:`, error);
                        this.items[asset.name] = null;
                        this.singleAssetLoaded(asset, null);
                    }
                );
            } else if (asset.type === "videoTexture") {
                this.video = {};
                this.videoTexture = {};

                this.video[asset.name] = document.createElement("video");
                this.video[asset.name].src = asset.path;
                this.video[asset.name].muted = true;
                this.video[asset.name].playsInline = true;
                this.video[asset.name].autoplay = true;
                this.video[asset.name].loop = true;
                
                // Add error handling for video
                this.video[asset.name].addEventListener('error', (e) => {
                    console.error(`[Resources] ❌ Error loading video ${asset.name} from ${asset.path}:`, e);
                    this.items[asset.name] = null;
                    this.singleAssetLoaded(asset, null);
                });
                
                this.video[asset.name].play().catch((error) => {
                    console.error(`[Resources] ❌ Error playing video ${asset.name}:`, error);
                });

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

    loadSceneAssets(sceneName, callback, progressCallback = null) {
        // progressCallback: function(loaded, total, percentage) - untuk update progress bar
        console.log(`[Resources] Loading assets for scene: ${sceneName}`);

        if (!this.assets[0][sceneName]) {
            console.error(`[Resources] Scene "${sceneName}" not found in assets!`);
            return;
        }

        // Check if assets already loaded
        const sceneAssets = this.assets[0][sceneName].assets;
        let allLoaded = true;
        for (const asset of sceneAssets) {
            if (!this.items[asset.name]) {
                allLoaded = false;
                break;
            }
        }

        if (allLoaded) {
            console.log(`[Resources] Assets for "${sceneName}" already loaded`);
            // Jika sudah loaded, tetap tampilkan progress bar sedikit untuk UX
            if (progressCallback) {
                // Animate dari 0% ke 100% dengan delay kecil
                setTimeout(() => {
                    progressCallback(sceneAssets.length, sceneAssets.length, 100);
                }, 200);
            }
            // Delay callback sedikit agar preloader terlihat
            setTimeout(() => {
                if (callback) callback();
            }, 300);
            return;
        }

        // Load missing assets
        let toLoad = 0;
        let loadedCount = 0;

        for (const asset of sceneAssets) {
            if (!this.items[asset.name]) {
                toLoad++;
            }
        }

        console.log(`[Resources] Need to load ${toLoad} assets for "${sceneName}"`);

        const checkComplete = () => {
            loadedCount++;
            const totalAssets = sceneAssets.length;
            const percentage = Math.round((loadedCount / toLoad) * 100);
            console.log(`[Resources] Scene assets: ${loadedCount}/${toLoad} loaded (${percentage}%)`);
            
            // Update progress callback jika ada
            if (progressCallback) {
                progressCallback(loadedCount, toLoad, percentage);
            }
            
            if (loadedCount === toLoad) {
                console.log(`[Resources] All assets for "${sceneName}" loaded!`);
                this.currentScene = sceneName;
                if (callback) callback();
            }
        };

        for (const asset of sceneAssets) {
            if (this.items[asset.name]) {
                continue; // Skip already loaded
            }

            if (asset.type === "glbModel") {
                this.loaders.gltfLoader.load(
                    asset.path,
                    (file) => {
                        this.items[asset.name] = file;
                        checkComplete();
                    },
                    undefined,
                    (error) => {
                        console.error(`[Resources] ❌ Error loading ${asset.name} from ${asset.path}:`, error);
                        this.items[asset.name] = null;
                        checkComplete();
                    }
                );
            } else if (asset.type === "imageTexture") {
                this.loaders.textureLoader.load(
                    asset.path,
                    (file) => {
                        this.items[asset.name] = file;
                        checkComplete();
                    },
                    undefined,
                    (error) => {
                        console.error(`[Resources] ❌ Error loading texture ${asset.name} from ${asset.path}:`, error);
                        this.items[asset.name] = null;
                        checkComplete();
                    }
                );
            } else if (asset.type === "cubeTexture") {
                this.loaders.cubeTextureLoader.load(
                    asset.path,
                    (file) => {
                        this.items[asset.name] = file;
                        checkComplete();
                    },
                    undefined,
                    (error) => {
                        console.error(`[Resources] ❌ Error loading cube texture ${asset.name} from ${asset.path}:`, error);
                        this.items[asset.name] = null;
                        checkComplete();
                    }
                );
            } else if (asset.type === "videoTexture") {
                if (!this.video) this.video = {};
                if (!this.videoTexture) this.videoTexture = {};

                this.video[asset.name] = document.createElement("video");
                this.video[asset.name].src = asset.path;
                this.video[asset.name].muted = true;
                this.video[asset.name].playsInline = true;
                this.video[asset.name].autoplay = true;
                this.video[asset.name].loop = true;
                
                // Add error handling for video
                this.video[asset.name].addEventListener('error', (e) => {
                    console.error(`[Resources] ❌ Error loading video ${asset.name} from ${asset.path}:`, e);
                    this.items[asset.name] = null;
                    checkComplete();
                });
                
                this.video[asset.name].play().catch((error) => {
                    console.error(`[Resources] ❌ Error playing video ${asset.name}:`, error);
                });

                this.videoTexture[asset.name] = new THREE.VideoTexture(
                    this.video[asset.name]
                );
                this.videoTexture[asset.name].flipY = false;
                this.videoTexture[asset.name].minFilter = THREE.NearestFilter;
                this.videoTexture[asset.name].magFilter = THREE.NearestFilter;
                this.videoTexture[asset.name].generateMipmaps = false;
                this.videoTexture[asset.name].ColorSpace = THREE.SRGBColorSpace;

                this.items[asset.name] = this.videoTexture[asset.name];
                checkComplete();
            }
        }
    }
}
