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

        this.loaders = new Loaders().loaders;

        // OPTIMIZATION: Combine shared and scene-specific assets
        this.startLoading();
    }

    startLoading() {
        const sharedAssets = this.assets[0]._shared?.assets || [];
        const sceneAssets = this.assets[0][this.currentScene]?.assets || [];

        // OPTIMIZATION: Combine all assets to load (shared + scene-specific)
        const allAssets = [...sharedAssets, ...sceneAssets];

        console.log(`[Resources] 🚀 Starting to load ${allAssets.length} assets (${sharedAssets.length} shared + ${sceneAssets.length} scene-specific)`);
        console.log(`[Resources] Asset list:`, allAssets.map(a => `${a.name} (${a.type})`));

        this.loaded = 0;
        this.queue = allAssets.length;

        if (this.queue === 0) {
            console.log(`[Resources] No assets to load`);
            this.isReady = true;
            this.emit("ready");
            return;
        }

        // Track which assets are still loading (for debugging)
        const loadingStatus = {};
        allAssets.forEach(asset => {
            loadingStatus[asset.name] = 'pending';
        });

        // Debug: Log loading status every 5 seconds
        const statusInterval = setInterval(() => {
            const pending = Object.keys(loadingStatus).filter(name => loadingStatus[name] === 'pending');
            if (pending.length > 0) {
                console.log(`[Resources] ⏳ Still loading ${pending.length} assets:`, pending);
            }
        }, 5000);

        // OPTIMIZATION: Load all assets in parallel
        allAssets.forEach((asset) => {
            console.log(`[Resources] 📦 Starting to load: ${asset.name} (${asset.type})`);
            loadingStatus[asset.name] = 'loading';

            this.loadSingleAsset(asset, (loadedAsset, file) => {
                this.items[loadedAsset.name] = file;
                this.loaded++;
                loadingStatus[loadedAsset.name] = file ? 'loaded' : 'failed';

                const percentage = Math.round((this.loaded / this.queue) * 100);
                console.log(`[Resources] ✅ Loaded ${this.loaded}/${this.queue} (${percentage}%): ${loadedAsset.name}`);
                this.emit("loading", this.loaded, this.queue);

                // Check if all loaded
                if (this.loaded === this.queue) {
                    clearInterval(statusInterval);
                    console.log(`[Resources] 🎉 All assets loaded! Emitting 'ready' event.`);
                    this.isReady = true;
                    this.emit("ready");
                }
            });
        });
    }

    // OPTIMIZATION: Helper method to load a single asset (supports parallel loading)
    loadSingleAsset(asset, callback) {
        if (asset.type === "glbModel") {
            this.loaders.gltfLoader.load(
                asset.path,
                (file) => {
                    callback(asset, file);
                },
                (progress) => {
                    // OPTIMIZATION: Only log progress every 10% to reduce console spam
                    const percentage = (progress.loaded / progress.total * 100).toFixed(1);
                    if (percentage % 10 < 1 || percentage > 99) {
                        console.log(`[Resources] Loading ${asset.name}: ${percentage}%`);
                    }
                },
                (error) => {
                    console.error(`[Resources] ❌ Error loading ${asset.name} from ${asset.path}:`, error);
                    this.items[asset.name] = null;
                    callback(asset, null);
                }
            );
        } else if (asset.type === "imageTexture") {
            this.loaders.textureLoader.load(
                asset.path,
                (file) => {
                    callback(asset, file);
                },
                undefined,
                (error) => {
                    console.error(`[Resources] ❌ Error loading texture ${asset.name} from ${asset.path}:`, error);
                    this.items[asset.name] = null;
                    callback(asset, null);
                }
            );
        } else if (asset.type === "cubeTexture") {
            this.loaders.cubeTextureLoader.load(
                asset.path,
                (file) => {
                    callback(asset, file);
                },
                undefined,
                (error) => {
                    console.error(`[Resources] ❌ Error loading cube texture ${asset.name} from ${asset.path}:`, error);
                    this.items[asset.name] = null;
                    callback(asset, null);
                }
            );
        } else if (asset.type === "videoTexture") {
            if (!this.video) this.video = {};
            if (!this.videoTexture) this.videoTexture = {};

            // FIX: Ensure callback is only called once
            let callbackCalled = false;
            const safeCallback = (file) => {
                if (!callbackCalled) {
                    callbackCalled = true;
                    callback(asset, file);
                }
            };

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
                safeCallback(null);
            });

            // Wait a bit to ensure video is ready
            this.video[asset.name].addEventListener('loadeddata', () => {
                console.log(`[Resources] Video ready: ${asset.name}`);
            });

            this.video[asset.name].play().catch((error) => {
                console.warn(`[Resources] ⚠️ Video autoplay blocked (this is normal): ${asset.name}`, error);
            });

            this.videoTexture[asset.name] = new THREE.VideoTexture(
                this.video[asset.name]
            );
            this.videoTexture[asset.name].flipY = false;
            this.videoTexture[asset.name].minFilter = THREE.NearestFilter;
            this.videoTexture[asset.name].magFilter = THREE.NearestFilter;
            this.videoTexture[asset.name].generateMipmaps = false;
            this.videoTexture[asset.name].ColorSpace = THREE.SRGBColorSpace;

            // Call callback immediately for video (it will play when ready)
            safeCallback(this.videoTexture[asset.name]);
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

    // OPTIMIZATION: Load scene assets with shared asset support
    loadSceneAssets(sceneName, callback, progressCallback = null) {
        console.log(`[Resources] Loading assets for scene: ${sceneName}`);

        if (!this.assets[0][sceneName]) {
            console.error(`[Resources] Scene "${sceneName}" not found in assets!`);
            return;
        }

        // OPTIMIZATION: Combine scene-specific assets with shared assets
        const sceneAssets = this.assets[0][sceneName].assets;
        const sharedAssets = this.assets[0]._shared?.assets || [];
        const allAssets = [...sharedAssets, ...sceneAssets];

        // Check if assets already loaded
        let allLoaded = true;
        for (const asset of allAssets) {
            if (!this.items[asset.name]) {
                allLoaded = false;
                break;
            }
        }

        if (allLoaded) {
            console.log(`[Resources] Assets for "${sceneName}" already loaded (using cache)`);
            if (progressCallback) {
                setTimeout(() => {
                    progressCallback(allAssets.length, allAssets.length, 100);
                }, 200);
            }
            setTimeout(() => {
                if (callback) callback();
            }, 300);
            return;
        }

        // OPTIMIZATION: Only load missing assets
        const assetsToLoad = allAssets.filter(asset => !this.items[asset.name]);
        const toLoad = assetsToLoad.length;
        let loadedCount = 0;

        console.log(`[Resources] Loading ${toLoad} new assets for "${sceneName}" (${allAssets.length - toLoad} cached)`);

        const checkComplete = () => {
            loadedCount++;
            const percentage = Math.round((loadedCount / toLoad) * 100);
            console.log(`[Resources] Scene assets: ${loadedCount}/${toLoad} loaded (${percentage}%)`);

            if (progressCallback) {
                progressCallback(loadedCount, toLoad, percentage);
            }

            if (loadedCount === toLoad) {
                console.log(`[Resources] All assets for "${sceneName}" loaded!`);
                this.currentScene = sceneName;
                if (callback) callback();
            }
        };

        // OPTIMIZATION: Load all missing assets in parallel
        assetsToLoad.forEach(asset => {
            this.loadSingleAsset(asset, (loadedAsset, file) => {
                this.items[loadedAsset.name] = file;
                checkComplete();
            });
        });
    }
}
