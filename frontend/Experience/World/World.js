import * as THREE from "three";
import { EventEmitter } from "events";
import Experience from "../Experience.js";

import { Octree } from "three/examples/jsm/math/Octree";

import Player from "./Player/Player.js";

import Westgate from "./Westgate.js";
import AcademicScene1 from "./academic/a_scene1.js";
import AcademicScene2A from "./academic/a_scene2a.js";
import AcademicScene2B from "./academic/a_scene2b.js";
import Organization from "./Organization/og_scene1.js";
import OrganizationScene2A from "./Organization/og_scene2a.js";
import OrganizationScene2B from "./Organization/og_scene2b.js";
import OrganizationScene3A from "./Organization/og_scene3a.js";
import OrganizationScene3B from "./Organization/og_scene3b.js";
import OrganizationScene4A from "./Organization/og_scene4a.js";
import OrganizationScene4B from "./Organization/og_scene4b.js";
import AcademicScene3A from "./academic/a_scene3a.js";
import AcademicScene3B from "./academic/a_scene3b.js";
import AcademicScene4A from "./academic/a_scene4a.js";
import AcademicScene4B from "./academic/a_scene4b.js";
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
            a_scene1: new THREE.Vector3(0, 10, 0), // Spawn inside the class room scene 1
            a_scene2a: new THREE.Vector3(0, 10, 0), // Spawn inside the class room scene 2a
            a_scene2b: new THREE.Vector3(0, 10, 0), // Spawn inside the class room scene 2b
            a_scene3a: new THREE.Vector3(0, 10, 0), // Spawn inside the science room scene 3a
            a_scene3b: new THREE.Vector3(0, 10, 0), // Spawn inside the science room scene 3b
            a_scene4a: new THREE.Vector3(0, 10, 0), // Spawn inside the class room scene 4a
            a_scene4b: new THREE.Vector3(0, 10, 0), // Spawn inside the class room scene 4b
            og_scene1: new THREE.Vector3(7, 5, 17), // Adjusted spawn point for 7x map scale
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

        // Redirect deprecated scene names
        if (sceneName === "class") {
            console.log(`[World] ⚠️ Scene "class" is deprecated, redirecting to "a_scene1"`);
            sceneName = "a_scene1";
            // Update URL
            const newUrl = `${window.location.origin}${window.location.pathname}?scene=a_scene1`;
            window.history.replaceState({ scene: 'a_scene1' }, '', newUrl);
            console.log(`[World] URL updated to: ${newUrl}`);
        }

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
                case "a_scene1":
                    console.log(`[World] Instantiating Academic Scene 1 (Class)`);
                    this.currentScene = new AcademicScene1();
                    break;
                case "a_scene2a":
                    console.log(`[World] Instantiating Academic Scene 2A (Class)`);
                    this.currentScene = new AcademicScene2A();
                    break;
                case "a_scene2b":
                    console.log(`[World] Instantiating Academic Scene 2B (Class)`);
                    this.currentScene = new AcademicScene2B();
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
                case "a_scene3a":
                    console.log(`[World] Instantiating Academic Scene 3A (Science Room)`);
                    this.currentScene = new AcademicScene3A();
                    console.log(`[World] Academic Scene 3A instantiated successfully`);
                    break;
                case "a_scene3b":
                    console.log(`[World] Instantiating Academic Scene 3B (Science Room)`);
                    this.currentScene = new AcademicScene3B();
                    console.log(`[World] Academic Scene 3B instantiated successfully`);
                    break;
                case "a_scene4a":
                    console.log(`[World] Instantiating Academic Scene 4A (Class)`);
                    this.currentScene = new AcademicScene4A();
                    console.log(`[World] Academic Scene 4A instantiated successfully`);
                    break;
                case "a_scene4b":
                    console.log(`[World] Instantiating Academic Scene 4B (Class)`);
                    this.currentScene = new AcademicScene4B();
                    console.log(`[World] Academic Scene 4B instantiated successfully`);
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

        // Show preloader saat scene transition
        this.showScenePreloader();

        // Delay kecil untuk memastikan preloader muncul dulu
        setTimeout(() => {
            // Load assets untuk scene baru dulu dengan progress callback
            this.experience.resources.loadSceneAssets(sceneName, () => {
                // Set progress ke 100% saat semua assets loaded
                this.updateSceneProgress(1, 1, 100);
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

                // Update URL di browser
                const newUrl = `${window.location.origin}${window.location.pathname}?scene=${sceneName}`;
                window.history.pushState({ scene: sceneName }, '', newUrl);
                console.log(`[World] URL updated to: ${newUrl}`);

                console.log(`[World] ✅ Scene switched successfully to: ${sceneName}`);

                // Hide preloader dan remove fade effect setelah scene loaded
                // Tambah delay lebih lama untuk memastikan scene benar-benar loaded
                setTimeout(() => {
                    this.hideScenePreloader();
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
                }, 500); // Delay lebih lama untuk memastikan scene benar-benar loaded dan visible
            } catch (error) {
                console.error("[World] ❌ Error during scene switch:", error);
                console.error("[World] Error stack:", error.stack);
                // Hapus fade jika error
                if (sourcePortal && sourcePortal.removeFade) {
                    sourcePortal.removeFade();
                }
            }
            }, (loaded, total, percentage) => {
                // Progress callback: update progress bar saat assets sedang dimuat
                this.updateSceneProgress(loaded, total, percentage);
            });
        }, 100); // Delay 100ms untuk memastikan preloader muncul dulu
    }

    /**
     * Show preloader saat scene transition dengan progress bar
     */
    showScenePreloader() {
        // Remove existing preloader if any
        const existing = document.getElementById('scene-transition-preloader');
        if (existing) {
            existing.remove();
        }
        
        // Create preloader element
        const preloader = document.createElement('div');
        preloader.id = 'scene-transition-preloader';
        preloader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1E407C 0%, #0a1f3d 100%);
            z-index: 999999999999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            opacity: 1; // Langsung visible, tidak perlu fade-in untuk memastikan terlihat
            visibility: visible;
        `;
        
        // Create loading spinner
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 60px;
            height: 60px;
            border: 5px solid rgba(255, 255, 255, 0.2);
            border-top-color: #96BEE6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 30px;
        `;
        
        // Create loading text
        const text = document.createElement('div');
        text.textContent = 'Memuat Scene...';
        text.style.cssText = `
            color: #fff;
            font-size: 24px;
            font-weight: 600;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', Arial, sans-serif;
            margin-bottom: 30px;
        `;
        
        // Create progress bar container
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            width: 400px;
            max-width: 80%;
            height: 8px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 15px;
        `;
        
        // Create progress bar fill
        const progressBar = document.createElement('div');
        progressBar.id = 'scene-progress-bar-fill';
        progressBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #96BEE6 0%, #5A9BD4 50%, #96BEE6 100%);
            background-size: 200% 100%;
            border-radius: 10px;
            transition: width 0.3s ease-out;
            animation: shimmer 2s linear infinite;
        `;
        
        // Create percentage text
        const percentageText = document.createElement('div');
        percentageText.id = 'scene-progress-percentage';
        percentageText.textContent = '0%';
        percentageText.style.cssText = `
            color: rgba(255, 255, 255, 0.9);
            font-size: 18px;
            font-weight: 500;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', Arial, sans-serif;
        `;
        
        // Add keyframes animation
        if (!document.getElementById('scene-preloader-animations')) {
            const style = document.createElement('style');
            style.id = 'scene-preloader-animations';
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes shimmer {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `;
            document.head.appendChild(style);
        }
        
        progressContainer.appendChild(progressBar);
        preloader.appendChild(spinner);
        preloader.appendChild(text);
        preloader.appendChild(progressContainer);
        preloader.appendChild(percentageText);
        
        // Store reference untuk update progress
        this.sceneProgressBar = progressBar;
        this.sceneProgressPercentage = percentageText;
        
        // Langsung append ke body dan pastikan visible
        document.body.appendChild(preloader);
        console.log('[World] Preloader created and appended to body');
        
        // Force reflow untuk memastikan render
        void preloader.offsetHeight;
    }
    
    /**
     * Update progress bar saat loading assets
     */
    updateSceneProgress(loaded, total, percentage) {
        if (this.sceneProgressBar && this.sceneProgressPercentage) {
            // Smooth transition ke percentage baru
            this.sceneProgressBar.style.width = `${percentage}%`;
            this.sceneProgressPercentage.textContent = `${percentage}%`;
        }
    }
    
    /**
     * Hide preloader setelah scene loaded
     */
    hideScenePreloader() {
        const preloader = document.getElementById('scene-transition-preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                if (preloader.parentNode) {
                    preloader.remove();
                }
                // Cleanup references
                this.sceneProgressBar = null;
                this.sceneProgressPercentage = null;
            }, 300);
        }
    }

    update() {
        if (this.player) this.player.update();

        // Update current scene jika punya method update
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update();
        }
    }
}
