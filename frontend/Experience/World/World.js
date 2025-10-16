import * as THREE from "three";
import { EventEmitter } from "events";
import Experience from "../Experience.js";

import { Octree } from "three/examples/jsm/math/Octree";

import Player from "./Player/Player.js";

import Westgate from "./Westgate.js";
import Class from "./Class.js";
import Organization from "./Organization.js";
import ScienceRoom from "./ScienceRoom.js";
import Environment from "./Environment.js";

export default class World extends EventEmitter {
    constructor() {
        super();
        this.experience = new Experience();
        this.resources = this.experience.resources;

        this.octree = new Octree();

        this.player = null;
        this.currentScene = null;

        // Define spawn points for each scene
        this.spawnPoints = {
            westgate: new THREE.Vector3(0, 10, 0),
            class: new THREE.Vector3(0, 10, 0),
            organization: new THREE.Vector3(0, 10, 10), // Spawn inside the organization room
            "science-room": new THREE.Vector3(0, 10, 0), // Spawn point untuk science room
        };

        this.resources.on("ready", () => {
            console.log(`[World] Resources ready, initializing world...`);
            if (this.player === null) {
                const initialScene = this.resources.currentScene;
                const initialSpawnPoint =
                    this.spawnPoints[initialScene] || this.spawnPoints.westgate;

                console.log(`[World] Loading scene: ${initialScene}`);
                this.loadScene(initialScene);
                this.player = new Player(initialSpawnPoint); // Pass initial spawn point
                this.environment = new Environment();
                console.log(`[World] World initialization complete!`);
            }
        });
    }

    loadScene(sceneName, targetPosition = null) {
        // Clear existing scene
        if (this.currentScene) {
            this.clearCurrentScene();
        }

        // Load new scene based on name
        switch (sceneName) {
            case "westgate":
                this.currentScene = new Westgate();
                break;
            case "class":
                this.currentScene = new Class();
                break;
            case "organization":
                this.currentScene = new Organization();
                break;
            case "science-room":
                this.currentScene = new ScienceRoom();
                break;
            default:
                this.currentScene = new Westgate();
        }

        // After loading a new scene, if the player exists, update its spawn point
        if (this.player) {
            // Gunakan targetPosition jika disediakan, atau default spawn point
            const newSpawnPoint = targetPosition ||
                this.spawnPoints[sceneName] ||
                this.spawnPoints.westgate;
            this.player.setSpawnPoint(newSpawnPoint);
        }
    }

    clearCurrentScene() {
        // Dispose current scene jika punya method dispose
        if (this.currentScene && this.currentScene.dispose) {
            this.currentScene.dispose();
        }

        // Clear octree
        this.octree = new Octree();

        // Remove old scene objects from Three.js scene
        // This will be implemented based on what objects need cleanup
    }

    switchScene(sceneName) {
        // Change scene resources and reload
        this.resources.loadScene(sceneName);
    }

    switchSceneWithPosition(sceneName, targetPosition) {
        console.log(`[World] Switching to scene: ${sceneName} at position:`, targetPosition);

        // Simpan reference ke resources
        const resources = this.experience.resources;

        // Clear current scene
        this.clearCurrentScene();

        // Load scene baru langsung tanpa reload resources jika sudah dimuat
        this.loadScene(sceneName, targetPosition);

        console.log(`[World] Scene switched successfully to: ${sceneName}`);
    }

    update() {
        if (this.player) this.player.update();

        // Update current scene jika punya method update
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update();
        }
    }
}
