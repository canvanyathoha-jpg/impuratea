import Experience from "../Experience.js";
import * as THREE from "three";
import Portal from "./Portal.js";
import NPC from "./NPC.js";
import NPCPair from "./NPCPair.js";

export default class Westgate {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.npcs = [];
        this.npcPairs = [];

        // IMPORTANT: Force stop any AI Voice from previous scenes (e.g., Organization scenes)
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            console.log("[Westgate] Force stopped all speech synthesis from previous scenes");
        }

        // Remove any AI Voice controls UI that might still be visible
        const existingAIVoiceControls = document.getElementById('ai-voice-controls');
        if (existingAIVoiceControls) {
            existingAIVoiceControls.remove();
            console.log("[Westgate] Removed AI Voice controls UI from previous scenes");
        }

        // Show loading indicator and load scene asynchronously
        this.initWithPreload();
    }

    initWithPreload() {
        console.log("[Westgate] Loading scene in background first...");
        
        // Load scene models asynchronously (non-blocking)
        this.loadSceneAsync().then(() => {
            console.log("[Westgate] Scene loaded successfully!");
            
        }).catch((error) => {
            console.error("[Westgate] Error loading scene:", error);
        });
    }

    showLoadingIndicator() {
        // Remove existing loader if any
        const existingLoader = document.getElementById('scene-loading-indicator');
        if (existingLoader) {
            existingLoader.remove();
        }

        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.id = 'scene-loading-indicator';
        this.loadingIndicator.style.pointerEvents = 'none'; // Jangan halangi input canvas
        this.loadingIndicator.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                border: 3px solid rgba(255, 215, 0, 0.8);
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                z-index: 10000001;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                pointer-events: none;
            ">
                <div style="
                    color: #FFD700;
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    font-family: 'Gilroy', Arial, sans-serif;
                ">
                    Memuat Scene...
                </div>
                <div style="
                    width: 300px;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    overflow: hidden;
                    margin: 0 auto;
                ">
                    <div id="loading-progress-bar" style="
                        width: 0%;
                        height: 100%;
                        background: linear-gradient(90deg, #1E407C, #8B0000, #FFD700);
                        border-radius: 10px;
                        transition: width 0.3s ease;
                        animation: pulse 1.5s ease-in-out infinite;
                    "></div>
                </div>
                <div style="
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 14px;
                    margin-top: 15px;
                    font-family: 'Gilroy', Arial, sans-serif;
                ">
                    Mohon tunggu sebentar...
                </div>
            </div>
        `;
        
        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(this.loadingIndicator);
    }

    hideLoadingIndicator() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.opacity = '0';
            this.loadingIndicator.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                if (this.loadingIndicator && document.body.contains(this.loadingIndicator)) {
                    this.loadingIndicator.remove();
                }
                this.loadingIndicator = null;
            }, 500);
        }
    }

    updateLoadingProgress(progress) {
        const progressBar = document.getElementById('loading-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    async loadSceneAsync() {
        return new Promise((resolve, reject) => {
            try {
                // Step 1: Load basic scene structure (non-blocking)
                this.updateLoadingProgress(20);
                this.setWorldAsync(() => {
                    this.updateLoadingProgress(60);
                    
                    // Step 2: Create portals (lightweight)
                    this.createPortals();
                    this.updateLoadingProgress(70);
                    
                    // Step 3: Create NPCs (lightweight)
                    this.createNPCs();
                    this.updateLoadingProgress(90);
                    
                    // Step 4: Ensure player is spawned correctly
                    this.ensurePlayerSpawned();
                    
                    // Step 5: Finalize
                    this.updateLoadingProgress(100);
                    
                    // Resolve immediately - no delay needed
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    ensurePlayerSpawned() {
        console.log("[Westgate] Ensuring player is spawned...");
        
        // Use requestAnimationFrame untuk non-blocking - no delay needed
        requestAnimationFrame(() => {
            if (this.experience.world && this.experience.world.player) {
                // Get spawn point for this scene
                const spawnPoint = this.experience.world.spawnPoints?.westgate || new THREE.Vector3(0, 10, 0);
                console.log("[Westgate] Setting player spawn point to:", spawnPoint);
                
                // Set spawn point (single call, let Player.js handle it)
                this.experience.world.player.setSpawnPoint(spawnPoint);
                
                // Ensure avatar is visible and in scene (lightweight check)
                if (this.experience.world.player.avatar?.avatar) {
                    this.experience.world.player.avatar.avatar.visible = true;
                    
                    // Only add to scene if not already there
                    if (!this.experience.world.player.avatar.avatar.parent) {
                        this.scene.add(this.experience.world.player.avatar.avatar);
                        console.log("[Westgate] Player avatar added to scene");
                    }
                }
            } else {
                console.warn("[Westgate] Player not found in world!");
            }
        });
    }

    setWorld() {
        // Synchronous version (backward compatibility)
        this.setWorldAsync(() => {});
    }

    setWorldAsync(callback) {
        console.log("[Westgate] setWorldAsync() called");
        
        // Create a group for all collidable objects
        this.collidableGroup = new THREE.Group();

        // Load the school model (schooll.glb)
        console.log("[Westgate] Loading school model...");
        
        // Clone model if already loaded to avoid re-parsing
        // Use requestAnimationFrame to avoid blocking during clone
        requestAnimationFrame(() => {
            if (this.resources.items.school && this.resources.items.school.scene) {
                // Use clone to avoid mutating the original
                // Clone is done in animation frame to avoid blocking
                this.schoolModel = this.resources.items.school.scene.clone(true);
                this.schoolModel.position.set(0, 0, 0);
                this.schoolModel.rotation.set(0, 0, 0);
                this.schoolModel.scale.set(10, 10, 10);
                this.collidableGroup.add(this.schoolModel);
                
                // Continue with collider setup
                this.setupCollider(callback);
            } else {
                console.error("[Westgate] School model not found!");
                if (callback) callback();
            }
        });
    }
    
    setupCollider(callback) {
        // Setup collider for physics
        console.log("[Westgate] Loading collider...");
        
        // Use requestAnimationFrame for non-blocking clone
        requestAnimationFrame(() => {
            if (this.resources.items.collider && this.resources.items.collider.scene) {
                // Clone collider as well
                this.collider = this.resources.items.collider.scene.clone(true);
                this.collider.position.set(0, 0, 0);
                this.collider.rotation.set(0, 0, 0);
                this.collider.scale.set(10, 10, 10);

                // Make collider invisible (lightweight operation)
                this.collider.traverse((child) => {
                    if (child.isMesh) {
                        child.visible = false;
                    }
                });
                this.collidableGroup.add(this.collider);
            } else {
                console.error("[Westgate] Collider not found!");
            }

            // Add the group to the scene
            this.scene.add(this.collidableGroup);

            // Build octree asynchronously to avoid blocking main thread
            // This is the heavy operation - do it in chunks using setTimeout
            console.log("[Westgate] Building octree asynchronously...");
            
            // Defer octree building to next event loop tick
            setTimeout(() => {
                // Further defer to allow rendering
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        try {
                            this.octree.fromGraphNode(this.collidableGroup);
                            console.log("[Westgate] Octree built successfully");

                            // Set collision objects for camera - CRITICAL for proper movement!
                            if (this.experience.camera && this.experience.camera.controls) {
                                this.experience.camera.controls.collisionObjects = this.collider;
                                console.log("[Westgate] Camera collision objects set");
                            }
                            
                            console.log("Westgate scene loaded with full collision enabled.");
                            
                            // Call callback when done
                            if (callback) callback();
                        } catch (error) {
                            console.error("[Westgate] Error building octree:", error);
                            if (callback) callback();
                        }
                    }, 100); // Small delay
                });
            }, 100); // Initial delay
        });
    }

    createPortals() {
        // Portal ke Academic Scene 1 (sesuaikan posisi dengan lokasi pintu)
        this.academicPortal = new Portal(
            new THREE.Vector3(49, 2, 30), // Posisi portal (sesuaikan dengan pintu)
            "a_scene1", // Target scene
            new THREE.Vector3(0, 10, 0), // Posisi spawn di scene baru
            "Academic Scene 1" // Nama ruangan
        );
    }

    createNPCs() {
        console.log("[Westgate] Creating NPCs with conversation pairs...");

        // Main character spawns at (0, 10, 0), so place NPCs around but not too close

        // ========== PAIR 1: Sarah & Budi - Walking and chatting on the right side ==========
        const pair1 = new NPCPair({
            distance: 3.5, // Distance between NPCs
            walkTogether: true,
            pauseInterval: 12000, // Pause every 12 seconds
            pauseDuration: 6000, // Chat for 6 seconds
            npc1: {
                name: "Sarah",
                gender: "female",
                position: new THREE.Vector3(15, 0, 8),
                initialRotation: 90,
                waypoints: [
                    new THREE.Vector3(15, 0, 8),
                    new THREE.Vector3(25, 0, 8),
                    new THREE.Vector3(25, 0, 12),
                    new THREE.Vector3(15, 0, 12)
                ],
                walkSpeed: 1.5
            },
            npc2: {
                name: "Budi",
                gender: "male",
                initialRotation: 90,
                walkSpeed: 1.5
            },
            conversation: [
                { speaker: 1, text: "Eh, kamu udah lihat pengumuman besok?" },
                { speaker: 2, text: "Belum nih, ada apa emang?" },
                { speaker: 1, text: "Ada seminar tentang AI katanya!" },
                { speaker: 2, text: "Wah menarik, jam berapa?" },
                { speaker: 1, text: "Jam 2 siang, di auditorium" },
                { speaker: 2, text: "Oke deh, ikut yuk!" }
            ]
        });
        this.npcPairs.push(pair1);

        // ========== PAIR 2: Rina & Andi - Walking and chatting on the left side ==========
        const pair2 = new NPCPair({
            distance: 3.5,
            walkTogether: true,
            pauseInterval: 15000,
            pauseDuration: 7000,
            npc1: {
                name: "Rina",
                gender: "female",
                position: new THREE.Vector3(-15, 0, 8),
                initialRotation: -90,
                waypoints: [
                    new THREE.Vector3(-15, 0, 8),
                    new THREE.Vector3(-25, 0, 8),
                    new THREE.Vector3(-25, 0, 12),
                    new THREE.Vector3(-15, 0, 12)
                ],
                walkSpeed: 1.6
            },
            npc2: {
                name: "Andi",
                gender: "male",
                initialRotation: -90,
                walkSpeed: 1.6
            },
            conversation: [
                { speaker: 2, text: "Tugas kelompok udah selesai belum?" },
                { speaker: 1, text: "Hampir nih, tinggal presentasinya" },
                { speaker: 2, text: "Kapan presentasinya?" },
                { speaker: 1, text: "Minggu depan, udah siap belum kamu?" },
                { speaker: 2, text: "Masih perlu latihan sih hehe" },
                { speaker: 1, text: "Yuk nanti latihan bareng!" }
            ]
        });
        this.npcPairs.push(pair2);

        // ========== PAIR 3: Siti & Rudi - Walking behind ==========
        const pair3 = new NPCPair({
            distance: 3.5,
            walkTogether: true,
            pauseInterval: 10000,
            pauseDuration: 5000,
            npc1: {
                name: "Siti",
                gender: "female",
                position: new THREE.Vector3(12, 0, 0),
                initialRotation: 90,
                waypoints: [
                    new THREE.Vector3(12, 0, 0),
                    new THREE.Vector3(22, 0, 0),
                    new THREE.Vector3(22, 0, 5),
                    new THREE.Vector3(12, 0, 5)
                ],
                walkSpeed: 1.4
            },
            npc2: {
                name: "Rudi",
                gender: "male",
                initialRotation: 90,
                walkSpeed: 1.4
            },
            conversation: [
                { speaker: 1, text: "Udah makan siang belum?" },
                { speaker: 2, text: "Belum nih, kamu?" },
                { speaker: 1, text: "Aku juga belum, yuk ke kantin" },
                { speaker: 2, text: "Boleh! Ada menu baru gak ya?" },
                { speaker: 1, text: "Kata temen ada nasi goreng spesial" },
                { speaker: 2, text: "Oke gas kesana!" }
            ]
        });
        this.npcPairs.push(pair3);

        // ========== SOLO NPC: Dewi - Walking alone in front ==========
        const soloNPC1 = new NPC({
            name: "Dewi",
            gender: "female",
            position: new THREE.Vector3(-12, 0, 15),
            initialRotation: -90,
            waypoints: [
                new THREE.Vector3(-12, 0, 15),
                new THREE.Vector3(-22, 0, 15),
                new THREE.Vector3(-22, 0, 20),
                new THREE.Vector3(-12, 0, 20)
            ],
            walkSpeed: 1.8,
            dialogues: [
                "Hmm... perpustakaan dimana ya?",
                "Wah cuaca bagus hari ini",
                "Semangat kuliahnya!",
                "Ngantuk banget nih..."
            ],
            chatInterval: 8000
        });
        this.npcs.push(soloNPC1);

        // ========== SOLO NPC: Fajar - Walking alone in front right ==========
        const soloNPC2 = new NPC({
            name: "Fajar",
            gender: "male",
            position: new THREE.Vector3(18, 0, 15),
            initialRotation: 90,
            waypoints: [
                new THREE.Vector3(18, 0, 15),
                new THREE.Vector3(28, 0, 15),
                new THREE.Vector3(28, 0, 20),
                new THREE.Vector3(18, 0, 20)
            ],
            walkSpeed: 2,
            dialogues: [
                "Sip, tinggal satu mata kuliah lagi",
                "Wifi kenceng nih disini",
                "Capek deh hari ini",
                "Besok libur kan ya?"
            ],
            chatInterval: 10000
        });
        this.npcs.push(soloNPC2);

        console.log(`[Westgate] Created ${this.npcPairs.length} NPC pairs and ${this.npcs.length} solo NPCs`);

        // Start NPCs movement after a short delay
        setTimeout(() => {
            // Start solo NPCs
            this.npcs.forEach(npc => {
                if (npc.waypoints.length > 0) {
                    npc.moveTo(npc.waypoints[0]);
                }
            });

            // Start paired NPCs
            this.npcPairs.forEach(pair => {
                if (pair.npc1.waypoints.length > 0) {
                    pair.npc1.moveTo(pair.npc1.waypoints[0]);
                }
                if (pair.npc2.waypoints.length > 0) {
                    pair.npc2.moveTo(pair.npc2.waypoints[0]);
                }
            });
        }, 1000);
    }

    update() {
        // Update portal animation
        if (this.academicPortal) {
            this.academicPortal.update();
        }

        // Update solo NPCs
        if (this.npcs && this.npcs.length > 0) {
            this.npcs.forEach(npc => {
                npc.update();
            });
        }

        // Update NPC pairs
        if (this.npcPairs && this.npcPairs.length > 0) {
            this.npcPairs.forEach(pair => {
                pair.update();
            });
        }
    }

    dispose() {
        console.log("[Westgate] Disposing Westgate scene...");

        // Hapus portal
        if (this.academicPortal) {
            this.academicPortal.dispose();
            this.academicPortal = null;
        }

        // Hapus solo NPCs
        if (this.npcs && this.npcs.length > 0) {
            this.npcs.forEach(npc => {
                npc.dispose();
            });
            this.npcs = [];
        }

        // Hapus NPC pairs
        if (this.npcPairs && this.npcPairs.length > 0) {
            this.npcPairs.forEach(pair => {
                pair.dispose();
            });
            this.npcPairs = [];
        }

        // Hapus model dari scene
        if (this.schoolModel && this.schoolModel.parent) {
            this.scene.remove(this.schoolModel.parent);
        }

        // Clean up loading indicator
        if (this.loadingIndicator) {
            this.hideLoadingIndicator();
        }

        console.log("[Westgate] Westgate scene disposed");
    }
}
