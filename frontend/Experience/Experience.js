import * as THREE from "three";

import Sizes from "./Utils/Sizes.js";
import Time from "./Utils/Time.js";
import Resources from "./Utils/Resources.js";
import SceneManager from "./Utils/SceneManager.js";
import assets from "./Utils/assets.js";

import Camera from "./Camera.js";
import Renderer from "./Renderer.js";
import Preloader from "./Preloader.js";

import World from "./World/World.js";

export default class Experience {
    static instance;

    constructor(canvas, socket) {
        if (Experience.instance) {
            return Experience.instance;
        }

        Experience.instance = this;

        this.canvas = canvas;
        this.socket = socket;
        this.sizes = new Sizes();
        this.time = new Time();

        this.setScene();
        this.setCamera();
        this.setRenderer();
        this.setResources();
        this.setPreloader();
        this.setWorld();
        this.setSceneManager();

        this.sizes.on("resize", () => {
            this.onResize();
        });

        this.update();
    }

    setSceneManager() {
        this.sceneManager = new SceneManager();

        // Show choice overlay only on westgate scene after resources are loaded
        if (this.resources.currentScene === 'westgate') {
            this.resources.on("ready", () => {
                // Show overlay after 2 seconds
                setTimeout(() => {
                    this.sceneManager.showChoiceOverlay();
                }, 2000);
            });
        }
    }

    setScene() {
        this.scene = new THREE.Scene();
    }

    setCamera() {
        this.camera = new Camera();
    }

    setRenderer() {
        this.renderer = new Renderer();
    }

    setResources() {
        this.resources = new Resources(assets);
    }

    setPreloader() {
        // Only show preloader on westgate scene (initial scene)
        if (this.resources.currentScene === 'westgate') {
            this.preloader = new Preloader();
        }
        // No loader for other scenes - load directly
    }

    setWorld() {
        this.world = new World();
    }

    onResize() {
        this.camera.onResize();
        this.renderer.onResize();
    }

    update() {
        if (this.preloader) this.preloader.update();
        if (this.camera) this.camera.update();
        if (this.renderer) this.renderer.update();
        if (this.world) this.world.update();
        if (this.time) this.time.update();

        // World.update() sudah memanggil currentScene.update()
        // Tidak perlu update individual scenes lagi
        // Legacy code dihapus karena sudah dihandle di World.update()

        window.requestAnimationFrame(() => {
            this.update();
        });
    }
}
