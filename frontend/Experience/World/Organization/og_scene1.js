import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import Portal from "../Portal.js";
import UIManager from "../../Utils/UIManager.js";
import OpeningStory, { SCENE_DATA } from "../../Utils/OpeningStory.js";

export default class Organization {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.npcSenior = null;
        this.uiManager = null;
        this.isPlayerNear = false;
        this.conversationStarted = false;
        this.openingShown = false;
        
        // Raycasting for speech bubble interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Debug: Check if player exists
        console.log("[OrgScene1] Constructor - Player exists:", !!this.experience.world.player);
        if (this.experience.world.player) {
            console.log("[OrgScene1] Constructor - Player avatar exists:", !!this.experience.world.player.avatar);
        }

        // Add event listeners for speech bubble interaction
        this.canvas = this.experience.canvas;
        this.canvas.addEventListener('click', this.onMouseClick.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        
        // Show opening story first
        this.initWithOpening();
    }

    initWithOpening() {
        console.log("[OrgScene1] Loading scene in background first...");
        
        // Show loading indicator
        this.showLoadingIndicator();
        
        // Load scene models asynchronously (non-blocking)
        this.loadSceneAsync().then(() => {
            console.log("[OrgScene1] Scene loaded successfully!");
            
            // Hide loading indicator
            this.hideLoadingIndicator();
            
            // Show opening story overlay immediately (no delay)
            console.log("[OrgScene1] Scene loaded, now showing opening story overlay...");
            
            try {
                this.openingStory = new OpeningStory(SCENE_DATA.og_scene1);
                
                // Show opening story overlay (blocks screen with z-index 10000)
                this.openingStory.show().then(() => {
                    console.log("[OrgScene1] Opening story dismissed - scene is now fully visible");
                }).catch((error) => {
                    console.error("[OrgScene1] Error in opening story:", error);
                });
            } catch (error) {
                console.error("[OrgScene1] Error creating opening story:", error);
            }
        }).catch((error) => {
            console.error("[OrgScene1] Error loading scene:", error);
            this.hideLoadingIndicator();
        });
    }

    // Old method - replaced by initWithOpening()
    _showOpeningStory() {
        console.log("[OrgScene1] Showing opening story...");
        
        // Create opening story overlay
        const overlay = document.createElement('div');
        overlay.id = 'opening-story-overlay';
        overlay.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(20,20,40,0.95)); z-index: 10000000; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; font-family: 'Arial', sans-serif;">
                <div style="max-width: 800px; text-align: center; padding: 40px; opacity: 0; transform: translateY(50px); transition: all 1s ease;">
                    <h1 style="font-size: 48px; margin-bottom: 30px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-shadow: 0 0 30px rgba(255,107,107,0.5);">
                        Scene 1: Organisasi Siswa
                    </h1>
                    <div style="font-size: 24px; line-height: 1.8; margin-bottom: 40px; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">
                        <p style="margin-bottom: 20px;">
                            Kamu adalah seorang siswa yang baru saja bergabung dengan organisasi siswa di sekolah. 
                            Sebagai bendahara junior, kamu bertanggung jawab mengelola dana organisasi.
                        </p>
                        <p style="margin-bottom: 20px;">
                            Hari ini, Senior Bendahara memanggilmu untuk membicarakan sesuatu yang penting...
                        </p>
                        <p style="font-style: italic; color: #ff6b6b;">
                            "Ada hal yang perlu kita diskusikan tentang dana acara kita."
                        </p>
                    </div>
                    <button id="start-scene-btn" style="background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border: none; padding: 15px 40px; font-size: 20px; color: white; border-radius: 25px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: all 0.3s ease; font-weight: bold;">
                        Mulai Scene
                    </button>
                </div>
            </div>
        `;

        // Add to document
        document.body.appendChild(overlay);
        console.log("[OrgScene1] Opening story overlay added");

        // Fade in animation
        setTimeout(() => {
            const content = overlay.querySelector('div > div');
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';
            console.log("[OrgScene1] Opening story faded in");
        }, 500);

        // Add button event listener
        document.getElementById('start-scene-btn').addEventListener('click', () => {
            console.log("[OrgScene1] Start scene button clicked");
            // Play click sound
            if (this.experience && this.experience.soundManager) {
                this.experience.soundManager.play('click', 0.6);
            }
            this.startScene();
        });

        // Store reference for cleanup
        this.openingOverlay = overlay;
    }

    startScene() {
        console.log("[OrgScene1] Starting scene...");
        
        // Fade out opening story
        if (this.openingOverlay) {
            this.openingOverlay.style.transition = 'opacity 1s ease';
            this.openingOverlay.style.opacity = '0';
            
            setTimeout(() => {
                this.openingOverlay.remove();
                this.openingOverlay = null;
                console.log("[OrgScene1] Opening story removed");
                
                // Initialize scene after opening is removed
                this.setWorld();
                this.createPortals();
                this.createNPC();
            }, 1000);
        }
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
                    
                    // Step 3: Create NPC (lightweight)
                    this.createNPC();
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
        console.log("[OrgScene1] Ensuring player is spawned...");
        
        // Use requestAnimationFrame untuk non-blocking - no delay needed
        requestAnimationFrame(() => {
            if (this.experience.world && this.experience.world.player) {
                // Get spawn point for this scene
                const spawnPoint = this.experience.world.spawnPoints?.og_scene1 || new THREE.Vector3(-5, 10, 20);
                console.log("[OrgScene1] Setting player spawn point to:", spawnPoint);
                
                // Set spawn point (single call, let Player.js handle it)
                this.experience.world.player.setSpawnPoint(spawnPoint);
                
                // Ensure avatar is visible and in scene (lightweight check)
                if (this.experience.world.player.avatar?.avatar) {
                    this.experience.world.player.avatar.avatar.visible = true;
                    
                    // Only add to scene if not already there
                    if (!this.experience.world.player.avatar.avatar.parent) {
                        this.scene.add(this.experience.world.player.avatar.avatar);
                        console.log("[OrgScene1] Player avatar added to scene");
                    }
                }
            } else {
                console.warn("[OrgScene1] Player not found in world!");
            }
        });
    }

    setWorld() {
        // Synchronous version (backward compatibility)
        this.setWorldAsync(() => {});
    }

    setWorldAsync(callback) {
        console.log("[OrgScene1] setWorldAsync() called");
        console.log("[OrgScene1] Resources available:", Object.keys(this.resources.items));
        
        // Create a group for all collidable objects
        this.collidableGroup = new THREE.Group();

        // Load the organization model (ruangan_osis.glb) - 7x scale (55% increase from original 5x)
        console.log("[OrgScene1] Loading organization model...");
        
        // Clone model if already loaded to avoid re-parsing
        // Use requestAnimationFrame to avoid blocking during clone
        requestAnimationFrame(() => {
            if (this.resources.items.organization && this.resources.items.organization.scene) {
                // Use clone to avoid mutating the original
                // Clone is done in animation frame to avoid blocking
                this.organizationModel = this.resources.items.organization.scene.clone(true);
                console.log("[OrgScene1] Organization model loaded:", !!this.organizationModel);
                this.organizationModel.position.set(0, 0, 0);
                this.organizationModel.rotation.set(0, 0, 0);
                this.organizationModel.scale.set(7, 7, 7); // Reduced from 8x to 7x for better proportions
                this.collidableGroup.add(this.organizationModel);
                
                // Continue with collider setup
                this.setupCollider(callback);
            } else {
                console.error("[OrgScene1] Organization model not found!");
                if (callback) callback();
            }
        });
    }
    
    setupCollider(callback) {
        // Setup collider for physics - match the organization model scale
        console.log("[OrgScene1] Loading collider...");
        
        // Use requestAnimationFrame for non-blocking clone
        requestAnimationFrame(() => {
            if (this.resources.items.collider && this.resources.items.collider.scene) {
                // Clone collider as well
                this.collider = this.resources.items.collider.scene.clone(true);
                console.log("[OrgScene1] Collider loaded:", !!this.collider);
                this.collider.position.set(0, 0, 0);
                this.collider.rotation.set(0, 0, 0);
                this.collider.scale.set(7, 7, 7); // Match organization model scale (7x)

                // Make collider invisible (lightweight operation)
                this.collider.traverse((child) => {
                    if (child.isMesh) {
                        child.visible = false;
                    }
                });
                this.collidableGroup.add(this.collider);
            } else {
                console.error("[OrgScene1] Collider not found!");
            }

            // Add the group to the scene
            this.scene.add(this.collidableGroup);

            // Build octree asynchronously to avoid blocking main thread
            // This is the heavy operation - do it in chunks using setTimeout
            console.log("[OrgScene1] Building octree asynchronously...");
            
            // Defer octree building to next event loop tick
            setTimeout(() => {
                // Further defer to allow rendering
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        try {
                            this.octree.fromGraphNode(this.collidableGroup);
                            console.log("[OrgScene1] Octree built successfully");

                            // Set collision objects for camera - CRITICAL for proper movement!
                            if (this.experience.camera && this.experience.camera.controls) {
                                this.experience.camera.controls.collisionObjects = this.collider;
                                console.log("[OrgScene1] Camera collision objects set");
                            }
                            
                            console.log("Organization scene loaded with full collision enabled.");
                            
                            // Call callback when done
                            if (callback) callback();
                        } catch (error) {
                            console.error("[OrgScene1] Error building octree:", error);
                            if (callback) callback();
                        }
                    }, 100); // Small delay
                });
            }, 100); // Initial delay
        });
    }

    createPortals() {
        // Portal ke Westgate atau scene lain - adjusted for 7x map scale
        this.westgatePortal = new Portal(
            new THREE.Vector3(68, 2, 42), // Adjusted position for 7x map scale (was 78,2,48 for 8x scale)
            "westgate", // Target scene
            new THREE.Vector3(0, 10, 0), // Posisi spawn di scene baru
            "Westgate" // Nama ruangan
        );
    }

    createNPC() {
        console.log("[OrgScene1] Creating Senior NPC...");
        console.log("[OrgScene1] Resources in createNPC:", Object.keys(this.resources.items));

        // Load proper male avatar model (same as player avatars)
        const maleModel = this.resources.items.male;
        console.log("[OrgScene1] Male model found:", !!maleModel);
        if (!maleModel) {
            console.error("[OrgScene1] Male avatar model not found!");
            console.log("[OrgScene1] Available resources:", Object.keys(this.resources.items));
            return;
        }

        // Clone the male avatar model using SkeletonUtils for proper skeleton handling
        this.npcSenior = SkeletonUtils.clone(maleModel.scene);
        this.npcSenior.position.set(8, -2, 21); // Moved left from 14 to 8 for easier access
        this.npcSenior.rotation.y = Math.PI; // Menghadap player
        // Scale 9x makes NPC same size as player - equal proportions
        this.npcSenior.scale.set(9, 9, 9);
        console.log("[OrgScene1] Adding NPC to scene...");
        this.scene.add(this.npcSenior);
        console.log("[OrgScene1] NPC added to scene successfully");

        // Clone animations for proper animation handling
        this.npcAnimations = maleModel.animations.map((clip) => clip.clone());
        
        // Setup animation mixer and idle animation
        this.npcMixer = new THREE.AnimationMixer(this.npcSenior);
        this.npcActions = {};
        
        // Map animations (same as NPC.js)
        this.npcActions.dancing = this.npcMixer.clipAction(this.npcAnimations[0]);
        this.npcActions.idle = this.npcMixer.clipAction(this.npcAnimations[1]);
        this.npcActions.jumping = this.npcMixer.clipAction(this.npcAnimations[2]);
        this.npcActions.running = this.npcMixer.clipAction(this.npcAnimations[3]);
        this.npcActions.walking = this.npcMixer.clipAction(this.npcAnimations[4]);
        this.npcActions.waving = this.npcMixer.clipAction(this.npcAnimations[5]);

        // Start with idle animation
        this.npcCurrentAction = this.npcActions.idle;
        this.npcCurrentAction.play();

        console.log("[OrgScene1] NPC Senior loaded with proper avatar model and animations:");
        console.log(this.npcSenior);

        // Initialize UIManager
        console.log("[OrgScene1] Initializing UIManager...");
        this.uiManager = new UIManager();
        console.log("[OrgScene1] UIManager initialized:", !!this.uiManager);
        console.log("[OrgScene1] UIManager container:", !!this.uiManager?.container);

        console.log("[OrgScene1] Senior NPC created at position:", this.npcSenior.position);
        console.log("[OrgScene1] Conversation will start automatically when player approaches");
    }

    checkPlayerProximity() {
        if (!this.experience.world.player || !this.experience.world.player.avatar || !this.npcSenior || !this.uiManager) {
            // Debug: Check what's missing
            if (!this.experience.world.player) {
                console.log("[OrgScene1] Player not found in world");
            } else if (!this.experience.world.player.avatar) {
                console.log("[OrgScene1] Player avatar not found");
            } else if (!this.npcSenior) {
                console.log("[OrgScene1] NPC Senior not found");
            } else if (!this.uiManager) {
                console.log("[OrgScene1] UI Manager not found");
            }
            return;
        }

        const playerPos = this.experience.world.player.avatar.avatar.position;
        const npcPos = this.npcSenior.position;
        const distance = playerPos.distanceTo(npcPos);

        // Debug: Log positions (reduced frequency)
        if (this.experience.time.elapsed % 2 === 0) {
            console.log("[OrgScene1] Player position:", playerPos);
            console.log("[OrgScene1] NPC position:", npcPos);
            console.log("[OrgScene1] Distance:", distance);
            console.log("[OrgScene1] IsPlayerNear:", this.isPlayerNear);
            console.log("[OrgScene1] ConversationStarted:", this.conversationStarted);
        }

        // Auto-start conversation when player gets close (no E key needed)
        if (distance < 50 && !this.conversationStarted) { // Increased threshold to 50 for easier triggering
            if (!this.isPlayerNear) {
                this.isPlayerNear = true;
                console.log("[OrgScene1] Player near NPC, starting conversation automatically");
                console.log("[OrgScene1] Distance:", distance, "Threshold: 50");
                console.log("[OrgScene1] ConversationStarted:", this.conversationStarted);
                
                // Start conversation immediately when player gets close
                this.startConversation();
            }
        } else {
            if (this.isPlayerNear && !this.conversationStarted) {
                this.isPlayerNear = false;
                console.log("[OrgScene1] Player left NPC proximity");
            }
        }
    }

    startConversation() {
        console.log("[OrgScene1] Starting conversation with Senior...");
        this.conversationStarted = true;

        // Create simple speech bubble directly in DOM
        console.log("[OrgScene1] Creating simple speech bubble...");
        this.createSimpleSpeechBubble();

        // Show choice panel after a delay (5-6 detik setelah layar hitam diklik)
        setTimeout(() => {
            console.log("[OrgScene1] Showing choices after 6 seconds...");
            this.showChoices();
        }, 6000); // Delay 6 detik untuk memberi waktu player melihat speech bubble dulu
    }

    createSimpleSpeechBubble() {
        console.log("[OrgScene1] Creating 3D speech bubble above NPC...");
        
        // Remove existing bubble if any
        const existingBubble = document.getElementById('senior-speech-bubble');
        if (existingBubble) {
            existingBubble.remove();
        }

        // Create 3D speech bubble using Three.js
        this.create3DSpeechBubble();
    }

    create3DSpeechBubble() {
        console.log("[OrgScene1] Creating 3D speech bubble...");
        
        // Create a group for the speech bubble
        this.speechBubbleGroup = new THREE.Group();
        
        // Create classic speech bubble background (rounded rectangle)
        const geometry = new THREE.PlaneGeometry(8, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: false,
            opacity: 1.0,
            side: THREE.FrontSide,
            depthWrite: false
        });
        this.speechBubblePlane = new THREE.Mesh(geometry, material);
        
        // Store material reference for hover effects
        this.speechBubbleMaterial = material;
        
        // Create classic speech bubble border (rounded rectangle)
        const borderGeometry = new THREE.PlaneGeometry(8.2, 4.2);
        const borderMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: false,
            opacity: 1.0,
            side: THREE.FrontSide,
            depthWrite: false
        });
        this.speechBubbleBorder = new THREE.Mesh(borderGeometry, borderMaterial);
        
        // Create classic speech bubble tail (pointing down from bottom-left)
        const tailGeometry = new THREE.ConeGeometry(0.4, 1.2, 6);
        const tailMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: false,
            opacity: 1.0,
            depthWrite: false
        });
        this.speechBubbleArrow = new THREE.Mesh(tailGeometry, tailMaterial);
        this.speechBubbleArrow.rotation.x = Math.PI;
        this.speechBubbleArrow.position.set(-2.5, -2.5, 0); // Positioned at bottom-left of bubble
        
        // Add all elements to group
        this.speechBubbleGroup.add(this.speechBubbleBorder);
        this.speechBubbleGroup.add(this.speechBubblePlane);
        this.speechBubbleGroup.add(this.speechBubbleArrow);
        
        // Create text texture for the speech bubble
        this.createSpeechTextTexture();
        
        // Position above NPC (moved left)
        this.speechBubbleGroup.position.set(4, 16, 21); // Moved left from 8 to 4
        
        // Rotate speech bubble 180 degrees (fixed rotation, no lookAt)
        this.speechBubbleGroup.rotation.y = Math.PI;
        
        // Add to scene
        this.scene.add(this.speechBubbleGroup);
        
        // Add tooltip for speech bubble interaction
        this.createSpeechBubbleTooltip();
        
        // Add alternative button for reading speech bubble
        this.createAlternativeButton();
        
        console.log("[OrgScene1] 3D speech bubble created and positioned above NPC");
        
        // No text overlay needed - 3D bubble is enough
        // this.createSpeechText();
    }

    createSpeechTextTexture() {
        console.log("[OrgScene1] Creating speech text texture...");
        
        // Create canvas for text
        const canvas = document.createElement('canvas');
        canvas.width = 1500;
        canvas.height = 750; // Much higher resolution for maximum text clarity
        const context = canvas.getContext('2d');
        
        // Enable anti-aliasing for smoother text
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        // Set background (improved contrast)
        context.fillStyle = 'rgba(255, 255, 255, 1.0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add very strong shadow for maximum text visibility
        context.shadowColor = 'rgba(0, 0, 0, 0.8)';
        context.shadowBlur = 5;
        context.shadowOffsetX = 3;
        context.shadowOffsetY = 3;
        
        // Set text properties (much larger and clearer with outline)
        context.fillStyle = '#000000';
        context.strokeStyle = '#FFFFFF';
        context.lineWidth = 3;
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Draw title with outline (much larger and clearer)
        context.strokeText('Senior Bendahara:', canvas.width / 2, 120);
        context.fillText('Senior Bendahara:', canvas.width / 2, 120);
        
        // Set dialogue font (much larger and clearer with outline)
        context.font = 'bold 36px Arial';
        
        // Draw dialogue text with outline (much clearer)
        const dialogue = "Dengar, dana acara kita mepet.\nSaya butuh kamu serahkan sebagian uang kas\n yang kamu pegang untuk 'dana taktis'.\n\nNanti laporannya gampang,\n kita manipulasi saja agar semuanya terlihat pas.";
        
        const lines = dialogue.split('\n');
        let y = 180;
        lines.forEach(line => {
            context.strokeText(line, canvas.width / 2, y);
            context.fillText(line, canvas.width / 2, y);
            y += 50; // Increased line spacing for much larger font
        });
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // Create material with text texture (improved to prevent flickering)
        const textMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: false,
            opacity: 1.0,
            side: THREE.FrontSide,
            depthWrite: false
        });
        
        // Create classic speech bubble text plane (rounded rectangle)
        const textGeometry = new THREE.PlaneGeometry(7.8, 3.8);
        this.speechTextPlane = new THREE.Mesh(textGeometry, textMaterial);
        this.speechTextPlane.position.z = 0.01; // Slightly in front of background
        
        // Add text plane to speech bubble group
        this.speechBubbleGroup.add(this.speechTextPlane);
        
        console.log("[OrgScene1] Speech text texture created and added to bubble");
    }

    createSpeechText() {
        console.log("[OrgScene1] Creating speech text overlay...");
        
        // Create text element
        const textDiv = document.createElement('div');
        textDiv.id = 'senior-speech-text';
        textDiv.innerHTML = `
            <div style="background: rgba(255,255,255,0.9); border: 2px solid #333; border-radius: 15px; padding: 15px; max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                <strong style="color: #333; font-size: 16px;">Senior Bendahara:</strong><br><br>
                <div style="color: #333; font-size: 14px; line-height: 1.4;">
                    "Dengar, dana acara kita mepet. Saya butuh kamu serahkan sebagian uang kas yang kamu pegang untuk 'dana taktis'.<br><br>
                    Nanti laporannya gampang, kita manipulasi saja agar semuanya terlihat pas."
                </div>
            </div>
        `;

        // Style the text overlay
        textDiv.style.cssText = `
            position: fixed;
            top: 20%;
            left: 25%;
            transform: translate(-50%, -50%);
            z-index: 10000000;
            opacity: 0;
            transition: opacity 0.5s ease;
            pointer-events: none;
        `;

        // Add to document
        document.body.appendChild(textDiv);
        
        // Fade in
        setTimeout(() => {
            textDiv.style.opacity = '1';
            console.log("[OrgScene1] Speech text overlay faded in");
        }, 100);

        // Store reference for cleanup
        this.speechTextOverlay = textDiv;
    }

    onMouseMove(event) {
        if (!this.speechBubbleGroup) {
            return;
        }

        // Calculate mouse position in normalized device coordinates
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update raycaster with camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);

        // Check for intersection with speech bubble
        const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);
        
        if (intersects.length > 0) {
            // Change cursor to pointer when hovering over speech bubble
            this.canvas.style.cursor = 'pointer';
            
            // Add hover effect to speech bubble (scale + color change)
            if (this.speechBubbleGroup.scale.x === 1) {
                this.speechBubbleGroup.scale.set(1.05, 1.05, 1.05);
                this.speechBubbleMaterial.color.setHex(0xf0f0f0); // Light gray hover color
                console.log("[OrgScene1] Speech bubble hover effect activated");
            }
        } else {
            // Reset cursor to default
            this.canvas.style.cursor = 'default';
            
            // Remove hover effect from speech bubble
            if (this.speechBubbleGroup.scale.x === 1.05) {
                this.speechBubbleGroup.scale.set(1, 1, 1);
                this.speechBubbleMaterial.color.setHex(0xffffff); // Reset to white
                console.log("[OrgScene1] Speech bubble hover effect deactivated");
            }
        }
    }

    onMouseClick(event) {
        console.log("[OrgScene1] Mouse clicked, checking for speech bubble interaction...");
        
        if (!this.speechBubbleGroup) {
            console.log("[OrgScene1] No speech bubble to interact with");
            return;
        }

        // Calculate mouse position in normalized device coordinates
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update raycaster with camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);

        // Check for intersection with speech bubble
        const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);
        
        if (intersects.length > 0) {
            console.log("[OrgScene1] Speech bubble clicked!");
            
            // Add click animation feedback
            this.speechBubbleGroup.scale.set(0.95, 0.95, 0.95);
            setTimeout(() => {
                this.speechBubbleGroup.scale.set(1.05, 1.05, 1.05);
            }, 100);
            
            this.showScreenSpeechBubble();
        } else {
            console.log("[OrgScene1] Clicked outside speech bubble");
        }
    }

    createAlternativeButton() {
        console.log("[OrgScene1] Creating alternative button for speech bubble...");
        
        // Create alternative button overlay
        this.alternativeButton = document.createElement('div');
        this.alternativeButton.id = 'alternative-speech-button';
        this.alternativeButton.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; z-index: 10000001;">
                <div style="margin-bottom: 10px; text-align: center;">
                    <div style="background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold;">
                        🔄 Alternatif
                    </div>
                </div>
                <button id="read-speech-btn" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 15px 25px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-family: 'Arial', sans-serif;
                " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.3)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.2)'">
                    <span style="font-size: 20px;">💬</span>
                    <span>Baca Percakapan</span>
                </button>
            </div>
        `;

        // Add to document
        document.body.appendChild(this.alternativeButton);
        
        // Add click event listener
        const button = this.alternativeButton.querySelector('#read-speech-btn');
        button.addEventListener('click', () => {
            console.log("[OrgScene1] Alternative button clicked!");
            // Play click sound
            if (this.experience && this.experience.soundManager) {
                this.experience.soundManager.play('click', 0.6);
            }
            this.showScreenSpeechBubble();
            
            // Add click animation
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = 'scale(1.05)';
            }, 100);
        });
        
        console.log("[OrgScene1] Alternative button created");
    }

    createSpeechBubbleTooltip() {
        console.log("[OrgScene1] Creating speech bubble tooltip...");
        
        // Create tooltip overlay
        const tooltip = document.createElement('div');
        tooltip.id = 'speech-bubble-tooltip';
        tooltip.innerHTML = `
            <div style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: white; padding: 10px 20px; border-radius: 25px; font-size: 14px; z-index: 10000002; pointer-events: none; opacity: 0; transition: opacity 0.3s ease;">
                <div style="text-align: center;">
                    <div style="font-weight: bold; margin-bottom: 5px;">💬 Klik pada bubble chat untuk membaca</div>
                    <div style="font-size: 12px; opacity: 0.8;">Gunakan kursor untuk berinteraksi</div>
                </div>
            </div>
        `;

        // Add to document
        document.body.appendChild(tooltip);
        
        // Show tooltip after a delay
        setTimeout(() => {
            const tooltipDiv = tooltip.querySelector('div');
            tooltipDiv.style.opacity = '1';
        }, 2000);
        
        // Hide tooltip after showing for a while
        setTimeout(() => {
            const tooltipDiv = tooltip.querySelector('div');
            tooltipDiv.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(tooltip)) {
                    document.body.removeChild(tooltip);
                }
            }, 300);
        }, 5000);
        
        console.log("[OrgScene1] Speech bubble tooltip created");
    }

    showScreenSpeechBubble() {
        console.log("[OrgScene1] Showing screen speech bubble...");
        
        // Create screen overlay speech bubble
        const screenBubble = document.createElement('div');
        screenBubble.id = 'screen-speech-bubble';
        screenBubble.innerHTML = `
            <div style="position: fixed; top: 20%; left: 50%; transform: translateX(-50%); background: white; border: 3px solid #333; border-radius: 20px; padding: 30px; max-width: 600px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); z-index: 10000001; cursor: pointer;">
                <div style="font-size: 24px; font-weight: bold; color: #000; margin-bottom: 15px; text-align: center;">
                    Senior Bendahara:
                </div>
                <div style="font-size: 18px; color: #000; line-height: 1.6; text-align: center;">
                    Dengar, dana acara kita mepet.<br>
                    Saya butuh kamu serahkan sebagian uang kas<br>
                    yang kamu pegang untuk 'dana taktis'.<br><br>
                    Nanti laporannya gampang,<br>
                    kita manipulasi saja agar semuanya terlihat pas.
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #666;">
                    Klik untuk menutup
                </div>
            </div>
        `;

        // Add to document
        document.body.appendChild(screenBubble);
        
        // Add click event to close
        screenBubble.addEventListener('click', () => {
            // Play click sound
            if (this.experience && this.experience.soundManager) {
                this.experience.soundManager.play('click', 0.6);
            }
            document.body.removeChild(screenBubble);
            console.log("[OrgScene1] Screen speech bubble closed");
        });
        
        console.log("[OrgScene1] Screen speech bubble displayed");
    }

    showChoices() {
        console.log("[OrgScene1] Creating choice panel (points hidden from display)...");
        
        // Remove existing choice panel if any
        const existingPanel = document.getElementById('choice-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        // Create choice panel element
        const panel = document.createElement('div');
        panel.id = 'choice-panel';
        panel.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(20,20,20,0.95)); border: 3px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 25px; min-width: 450px; box-shadow: 0 8px 32px rgba(0,0,0,0.8);">
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <button id="choice-A" style="display: flex; align-items: center; gap: 15px; padding: 18px 22px; background: rgba(76,175,80,0.15); border: 2px solid rgba(76,175,80,0.5); border-radius: 12px; color: white; cursor: pointer; transition: all 0.3s ease; text-align: left; font-size: 16px;">
                        <span style="font-size: 24px; font-weight: bold; min-width: 35px; text-align: center; color: #4caf50;">A</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 17px; margin-bottom: 5px; line-height: 1.3;">Menolak menyerahkan uang</div>
                            <div style="font-size: 13px; opacity: 0.7; line-height: 1.4;">Jujur meski dapat tugas berat</div>
                        </div>
                    </button>
                    <button id="choice-B" style="display: flex; align-items: center; gap: 15px; padding: 18px 22px; background: rgba(244,67,54,0.15); border: 2px solid rgba(244,67,54,0.5); border-radius: 12px; color: white; cursor: pointer; transition: all 0.3s ease; text-align: left; font-size: 16px;">
                        <span style="font-size: 24px; font-weight: bold; min-width: 35px; text-align: center; color: #f44336;">B</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 17px; margin-bottom: 5px; line-height: 1.3;">Menyerahkan uang & memanipulasi anggaran</div>
                            <div style="font-size: 13px; opacity: 0.7; line-height: 1.4;">Ikut serta korupsi</div>
                        </div>
                    </button>
                </div>
            </div>
        `;

        // Style the panel - positioned at bottom of screen
        panel.style.cssText = `
            position: fixed;
            bottom: 20%;
            left: 50%;
            transform: translate(-50%, 0);
            z-index: 10000000;
            opacity: 0;
            transition: opacity 0.5s ease;
            pointer-events: all;
        `;

        // Add to document
        document.body.appendChild(panel);
        console.log("[OrgScene1] Choice panel added to DOM");

        // Fade in
        setTimeout(() => {
            panel.style.opacity = '1';
            console.log("[OrgScene1] Choice panel faded in");
        }, 100);

        // Add event listeners
        document.getElementById('choice-A').addEventListener('click', () => {
            console.log("[OrgScene1] Player chose A");
            this.handleChoice('A');
        });

        document.getElementById('choice-B').addEventListener('click', () => {
            console.log("[OrgScene1] Player chose B");
            this.handleChoice('B');
        });

        // Add hover effects
        document.getElementById('choice-A').addEventListener('mouseenter', function() {
            this.style.background = 'rgba(76,175,80,0.3)';
            this.style.borderColor = 'rgba(76,175,80,0.8)';
            this.style.transform = 'scale(1.02)';
        });

        document.getElementById('choice-A').addEventListener('mouseleave', function() {
            this.style.background = 'rgba(76,175,80,0.15)';
            this.style.borderColor = 'rgba(76,175,80,0.5)';
            this.style.transform = 'scale(1)';
        });

        document.getElementById('choice-B').addEventListener('mouseenter', function() {
            this.style.background = 'rgba(244,67,54,0.3)';
            this.style.borderColor = 'rgba(244,67,54,0.8)';
            this.style.transform = 'scale(1.02)';
        });

        document.getElementById('choice-B').addEventListener('mouseleave', function() {
            this.style.background = 'rgba(244,67,54,0.15)';
            this.style.borderColor = 'rgba(244,67,54,0.5)';
            this.style.transform = 'scale(1)';
        });

        // Store reference for cleanup
        this.choicePanel = panel;
    }

    handleChoice(choiceId) {
        console.log(`[OrgScene1] Player chose: ${choiceId}`);

        // Determine score and next scene based on choice
        let scoreIncrease = 0;
        let nextScene = '';

        if (choiceId === 'A') {
            // Pilihan A: Tidak memberikan uang → Scene 2A
            scoreIncrease = 0;
            nextScene = 'og_scene2a';
            console.log(`[OrgScene1] Choice A → Load og_scene2a (consequence of refusing)`);
        } else if (choiceId === 'B') {
            // Pilihan B: Memberikan uang → Scene 2B
            scoreIncrease = 25;
            nextScene = 'og_scene2b';
            console.log(`[OrgScene1] Choice B → Load og_scene2b (consequence of giving money)`);
        }

        // Update corruption score via ScoreManager (hidden during gameplay)
        if (this.experience && this.experience.scoreManager) {
            this.experience.scoreManager.addScore(scoreIncrease);
            console.log(`[OrgScene1] ScoreManager total score: ${this.experience.scoreManager.getScore()}%`);
        }
        console.log(`[OrgScene1] Loading next scene: ${nextScene}`);

        // Remove UI elements
        this.uiManager.removeSpeechBubble('senior');
        this.uiManager.removeChoicePanel();

        // Directly load next scene without feedback
        this.loadScene(nextScene);
    }

    loadScene(sceneName) {
        console.log(`[OrgScene1] Loading scene: ${sceneName}`);
        
        // Create fade transition
        const fadeDiv = document.createElement('div');
        fadeDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            z-index: 10000000;
            opacity: 0;
            transition: opacity 0.5s;
        `;
        document.body.appendChild(fadeDiv);

        // Fade in
        setTimeout(() => fadeDiv.style.opacity = '1', 10);

        // Load new scene after fade
        setTimeout(() => {
            console.log(`[OrgScene1] Switching to scene: ${sceneName}`);
            
            // Directly navigate to new scene URL
            const newUrl = `${window.location.origin}${window.location.pathname}?scene=${sceneName}`;
            console.log(`[OrgScene1] Navigating to: ${newUrl}`);
            
            // Use window.location.href for reliable navigation
            window.location.href = newUrl;
        }, 500);
    }

    update() {
        // Update portal animation
        if (this.westgatePortal) {
            this.westgatePortal.update();
        }

        // Update NPC animation mixer
        if (this.npcMixer) {
            this.npcMixer.update(this.experience.time.delta * 0.001);
        }

        // Debug: Check player avatar periodically (reduced frequency)
        if (this.experience.world.player && this.experience.world.player.avatar) {
            const playerPos = this.experience.world.player.avatar.avatar.position;
            const playerOnFloor = this.experience.world.player.player.onFloor;
            // Only log every 60 frames to reduce spam
            if (this.experience.time.elapsed % 1 === 0) {
                console.log("[OrgScene1] Update - Player avatar position:", playerPos);
                console.log("[OrgScene1] Update - Player onFloor:", playerOnFloor);
            }
        }

        // Check player proximity to NPC
        this.checkPlayerProximity();

        // Update spatial UI positions (restored for other systems)
        if (this.uiManager) {
            this.uiManager.updatePositions();
        }
    }

    dispose() {
        console.log("[Organization] Disposing Organization scene...");

        // Clean up event listeners
        if (this.canvas) {
            this.canvas.removeEventListener('click', this.onMouseClick.bind(this));
            this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
        }

        // Clean up alternative button
        if (this.alternativeButton) {
            this.alternativeButton.remove();
            this.alternativeButton = null;
        }

        // Clean up simple speech bubble
        if (this.speechBubble) {
            this.speechBubble.remove();
            this.speechBubble = null;
        }

        // Clean up choice panel
        if (this.choicePanel) {
            this.choicePanel.remove();
            this.choicePanel = null;
        }

        // Clean up opening story
        if (this.openingStory) {
            this.openingStory.dispose();
            this.openingStory = null;
        }

        // Clean up 3D speech bubble
        if (this.speechBubbleGroup) {
            this.scene.remove(this.speechBubbleGroup);
            this.speechBubbleGroup = null;
        }

        // Dispose UIManager (this will clean up all spatial UI elements)
        if (this.uiManager) {
            this.uiManager.dispose();
            this.uiManager = null;
        }

        // Hapus NPC dan animasi mixer
        if (this.npcSenior) {
            this.scene.remove(this.npcSenior);
            this.npcSenior = null;
        }
        
        // Clean up animation mixer
        if (this.npcMixer) {
            this.npcMixer.stopAllAction();
            this.npcMixer = null;
        }
        
        // Clean up animation actions
        if (this.npcActions) {
            this.npcActions = null;
        }
        
        if (this.npcAnimations) {
            this.npcAnimations = null;
        }

        // Hapus portal
        if (this.westgatePortal) {
            this.westgatePortal.dispose();
            this.westgatePortal = null;
        }

        // Hapus model dari scene
        if (this.organizationModel && this.organizationModel.parent) {
            this.scene.remove(this.organizationModel.parent);
        }

        // Clean up loading indicator
        if (this.loadingIndicator) {
            this.hideLoadingIndicator();
        }

        console.log("[Organization] Organization scene disposed");
    }
}