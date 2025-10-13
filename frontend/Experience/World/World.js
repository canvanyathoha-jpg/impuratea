import * as THREE from "three";
import { EventEmitter } from "events";
import Experience from "../Experience.js";

import { Octree } from "three/examples/jsm/math/Octree";

import Player from "./Player/Player.js";

import Westgate from "./Westgate.js";
import Class from "./Class.js";
import Organization from "./Organization.js";
import Environment from "./Environment.js";

export default class World extends EventEmitter {
    constructor() {
        super();
        this.experience = new Experience();
        this.resources = this.experience.resources;

        this.octree = new Octree();

        this.player = null;
        this.currentScene = null;

        this.resources.on("ready", () => {
            console.log(`[World] Resources ready, initializing world...`);
            if (this.player === null) {
                // Load initial scene based on current scene name
                console.log(`[World] Loading scene: ${this.resources.currentScene}`);
                this.loadScene(this.resources.currentScene);
                this.player = new Player();
                this.environment = new Environment();
                console.log(`[World] World initialization complete!`);
            }
        });
    }

    loadScene(sceneName) {
        // Clear existing scene
        if (this.currentScene) {
            this.clearCurrentScene();
        }

        // Load new scene based on name
        switch(sceneName) {
            case 'westgate':
                this.currentScene = new Westgate();
                break;
            case 'class':
                this.currentScene = new Class();
                break;
            case 'organization':
                this.currentScene = new Organization();
                break;
            default:
                this.currentScene = new Westgate();
        }
    }

    clearCurrentScene() {
        // Clear octree
        this.octree = new Octree();

        // Remove old scene objects from Three.js scene
        // This will be implemented based on what objects need cleanup
    }

    switchScene(sceneName) {
        // Change scene resources and reload
        this.resources.loadScene(sceneName);
    }

    update() {
        if (this.player) this.player.update();
    }
}
