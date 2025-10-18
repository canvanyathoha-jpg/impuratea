import * as THREE from "three";
import { EventEmitter } from "events";
import Experience from "../Experience.js";

import { Octree } from "three/examples/jsm/math/Octree";

import Player from "./Player/Player.js";

import Westgate from "./Westgate.js";
import Class from "./academic/Class.js";
import Organization from "./Organization/og_scene1.js";
import OrganizationScene2A from "./Organization/og_scene2a.js";
import OrganizationScene2B from "./Organization/og_scene2b.js";
import OrganizationScene3A from "./Organization/og_scene3a.js";
import OrganizationScene3B from "./Organization/og_scene3b.js";
import OrganizationScene4A from "./Organization/og_scene4a.js";
import OrganizationScene4B from "./Organization/og_scene4b.js";
import ScienceRoom from "./academic/ScienceRoom.js";
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
            og_scene1: new THREE.Vector3(0, 10, 10), // Spawn inside the organization room
            og_scene2a: new THREE.Vector3(0, 10, 10), // Spawn inside the organization room scene 2a
            og_scene2b: new THREE.Vector3(0, 10, 10), // Spawn inside the organization room scene 2b
            og_scene3a: new THREE.Vector3(-5, 10, 20), // Spawn inside the caffe room (shifted left and back)
            og_scene3b: new THREE.Vector3(-5, 10, 20), // Spawn inside the caffe room scene 3b
            og_scene4a: new THREE.Vector3(0, 10, 0), // Spawn inside the RuangGuru room
            og_scene4b: new THREE.Vector3(0, 10, 0), // Spawn inside the RuangGuru room scene 4b
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
        console.log(`[World] loadScene called with: ${sceneName}`);
        console.log(`[World] targetPosition:`, targetPosition);

        // Clear existing scene
        if (this.currentScene) {
            console.log(`[World] Clearing existing scene before loading new one`);
            this.clearCurrentScene();
        }

        // Load new scene based on name
        console.log(`[World] Creating new scene: ${sceneName}`);
        try {
            switch (sceneName) {
                case "westgate":
                    console.log(`[World] Instantiating Westgate`);
                    this.currentScene = new Westgate();
                    break;
                case "class":
                    console.log(`[World] Instantiating Class`);
                    this.currentScene = new Class();
                    break;
                case "og_scene1":
                    console.log(`[World] Instantiating Organization (og_scene1)`);
                    this.currentScene = new Organization();
                    break;
                case "og_scene2a":
                    console.log(`[World] Instantiating Organization Scene 2A (og_scene2a)`);
                    this.currentScene = new OrganizationScene2A();
                    break;
                case "og_scene2b":
                    console.log(`[World] Instantiating Organization Scene 2B (og_scene2b)`);
                    this.currentScene = new OrganizationScene2B();
                    break;
                case "og_scene3a":
                    console.log(`[World] Instantiating Organization Scene 3A - Caffe (og_scene3a)`);
                    this.currentScene = new OrganizationScene3A();
                    break;
                case "og_scene3b":
                    console.log(`[World] Instantiating Organization Scene 3B - Caffe (og_scene3b)`);
                    this.currentScene = new OrganizationScene3B();
                    break;
                case "og_scene4a":
                    console.log(`[World] Instantiating Organization Scene 4A - RuangGuru (og_scene4a)`);
                    this.currentScene = new OrganizationScene4A();
                    break;
                case "og_scene4b":
                    console.log(`[World] Instantiating Organization Scene 4B - RuangGuru (og_scene4b)`);
                    this.currentScene = new OrganizationScene4B();
                    break;
                case "science-room":
                    console.log(`[World] Instantiating ScienceRoom`);
                    this.currentScene = new ScienceRoom();
                    console.log(`[World] ScienceRoom instantiated successfully`);
                    break;
                default:
                    console.log(`[World] Unknown scene, defaulting to Westgate`);
                    this.currentScene = new Westgate();
            }
            console.log(`[World] Scene instance created successfully`);
        } catch (error) {
            console.error(`[World] ❌ Error creating scene:`, error);
            console.error(`[World] Error stack:`, error.stack);
            throw error;
        }

        // After loading a new scene, if the player exists, update its spawn point
        console.log(`[World] Setting player spawn point`);
        if (this.player) {
            // Gunakan targetPosition jika disediakan, atau default spawn point
            const newSpawnPoint = targetPosition ||
                this.spawnPoints[sceneName] ||
                this.spawnPoints.westgate;
            console.log(`[World] New spawn point:`, newSpawnPoint);
            this.player.setSpawnPoint(newSpawnPoint);
            console.log(`[World] Player spawn point set`);
        } else {
            console.log(`[World] No player found, skipping spawn point`);
        }

        console.log(`[World] loadScene completed`);
    }

    clearCurrentScene() {
        console.log("[World] clearCurrentScene called");

        // Dispose current scene jika punya method dispose
        if (this.currentScene) {
            console.log("[World] Current scene exists, disposing...");
            if (this.currentScene.dispose) {
                try {
                    this.currentScene.dispose();
                    console.log("[World] Scene disposed successfully");
                } catch (error) {
                    console.error("[World] Error disposing scene:", error);
                }
            } else {
                console.log("[World] Scene has no dispose method");
            }
        }

        // Octree akan dibuat ulang setelah clear, di switchSceneWithPosition
        console.log("[World] clearCurrentScene completed");
    }

    switchScene(sceneName) {
        // Change scene resources and reload
        this.resources.loadScene(sceneName);
    }

    switchSceneWithPosition(sceneName, targetPosition, sourcePortal = null) {
        console.log(`[World] Switching to scene: ${sceneName} at position:`, targetPosition);

        // Load assets untuk scene baru dulu
        this.experience.resources.loadSceneAssets(sceneName, () => {
            console.log(`[World] Assets loaded, now switching scene...`);

            try {
                // Clear current scene
                console.log(`[World] Clearing current scene...`);
                this.clearCurrentScene();
                console.log(`[World] Current scene cleared`);

                // PENTING: Buat octree baru SEBELUM load scene
                console.log(`[World] Creating fresh Octree for new scene`);
                this.octree = new Octree();
                console.log(`[World] Fresh Octree created`);

                // Load scene baru
                console.log(`[World] Loading new scene: ${sceneName}`);
                this.loadScene(sceneName, targetPosition);
                console.log(`[World] ✅ Scene loaded successfully!`);

                console.log(`[World] ✅ Scene switched successfully to: ${sceneName}`);

                // Remove fade effect setelah scene loaded
                setTimeout(() => {
                    console.log("[World] Removing fade effect...");
                    // Gunakan source portal jika ada
                    if (sourcePortal && sourcePortal.removeFade) {
                        sourcePortal.removeFade();
                        console.log("[World] Fade removed via source portal");
                    } else {
                        // Fallback: cari portal di scene baru
                        if (this.currentScene && this.currentScene.classPortal) {
                            this.currentScene.classPortal.removeFade();
                        }
                        if (this.currentScene && this.currentScene.labPortal) {
                            this.currentScene.labPortal.removeFade();
                        }
                        console.log("[World] Fade removed via scene portals");
                    }
                }, 100); // Dikurangi dari 800ms ke 100ms
            } catch (error) {
                console.error("[World] ❌ Error during scene switch:", error);
                console.error("[World] Error stack:", error.stack);
                // Hapus fade jika error
                if (sourcePortal && sourcePortal.removeFade) {
                    sourcePortal.removeFade();
                }
            }
        });
    }

    update() {
        if (this.player) this.player.update();

        // Update current scene jika punya method update
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update();
        }
    }
}
