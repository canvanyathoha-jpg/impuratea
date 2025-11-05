import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import Portal from "../Portal.js";
import UIManager from "../../Utils/UIManager.js";
import OpeningStory, { SCENE_DATA } from "../../Utils/OpeningStory.js";
import Ending from "../../Utils/Ending.js";

export default class OrganizationScene4B {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.npcPembina = null;
        this.uiManager = null;
        this.isPlayerNear = false;
        this.conversationStarted = false;
        
        // Raycasting for speech bubble interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Add event listeners for speech bubble interaction
        this.canvas = this.experience.canvas;
        this.canvas.addEventListener('click', this.onMouseClick.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        
        // Show opening story first
        this.initWithOpening();
    }

    initWithOpening() {
        console.log("[OrgScene4B] Loading scene in background first...");
        
        // Show loading indicator
        this.showLoadingIndicator();
        
        // Load scene models asynchronously (non-blocking)
        this.loadSceneAsync().then(() => {
            console.log("[OrgScene4B] Scene loaded successfully!");
            
            // Hide loading indicator
            this.hideLoadingIndicator();
            
            // Show opening story overlay immediately (no delay)
            console.log("[OrgScene4B] Scene loaded, now showing opening story overlay...");
            
            try {
                this.openingStory = new OpeningStory(SCENE_DATA.og_scene4b);
                
                // Show opening story overlay (blocks screen with z-index 10000000)
                this.openingStory.show().then(() => {
                    console.log("[OrgScene4B] Opening story dismissed - scene is now fully visible");
                    
                    // Auto-start conversation after opening story (no proximity needed)
                    setTimeout(() => {
                        console.log("[OrgScene4B] Auto-starting conversation...");
                        this.startConversation();
                    }, 2000);
                }).catch((error) => {
                    console.error("[OrgScene4B] Error in opening story:", error);
                });
            } catch (error) {
                console.error("[OrgScene4B] Error creating opening story:", error);
            }
        }).catch((error) => {
            console.error("[OrgScene4B] Error loading scene:", error);
            this.hideLoadingIndicator();
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
        console.log("[OrgScene4B] Ensuring player is spawned...");
        
        // Use requestAnimationFrame untuk non-blocking - no delay needed
        requestAnimationFrame(() => {
            if (this.experience.world && this.experience.world.player) {
                // Get spawn point for this scene
                const spawnPoint = this.experience.world.spawnPoints?.og_scene4b || new THREE.Vector3(-5, 10, 20);
                console.log("[OrgScene4B] Setting player spawn point to:", spawnPoint);
                
                // Set spawn point (single call, let Player.js handle it)
                this.experience.world.player.setSpawnPoint(spawnPoint);
                
                // Ensure avatar is visible and in scene (lightweight check)
                if (this.experience.world.player.avatar?.avatar) {
                    this.experience.world.player.avatar.avatar.visible = true;
                    
                    // Only add to scene if not already there
                    if (!this.experience.world.player.avatar.avatar.parent) {
                        this.scene.add(this.experience.world.player.avatar.avatar);
                        console.log("[OrgScene4B] Player avatar added to scene");
                    }
                }
            } else {
                console.warn("[OrgScene4B] Player not found in world!");
            }
        });
    }

    setWorld() {
        // Synchronous version (backward compatibility)
        this.setWorldAsync(() => {});
    }

    setWorldAsync(callback) {
        console.log("[OrgScene4B] setWorldAsync() called");
        
        // Create a group for all collidable objects
        this.collidableGroup = new THREE.Group();

        // Load the RuangGuru model
        console.log("[OrgScene4B] Loading RuangGuru model...");
        
        // Clone model if already loaded to avoid re-parsing
        // Use requestAnimationFrame to avoid blocking during clone
        requestAnimationFrame(() => {
            if (this.resources.items.ruangguru && this.resources.items.ruangguru.scene) {
                // Use clone to avoid mutating the original
                // Clone is done in animation frame to avoid blocking
                this.ruangGuruModel = this.resources.items.ruangguru.scene.clone(true);
                this.ruangGuruModel.position.set(0, 0, 0);
                this.ruangGuruModel.rotation.set(0, 0, 0);
                this.ruangGuruModel.scale.set(12, 12, 12);
                this.collidableGroup.add(this.ruangGuruModel);
                
                // Continue with collider setup
                this.setupCollider(callback);
            } else {
                console.error("[OrgScene4B] RuangGuru model not found!");
                if (callback) callback();
            }
        });
    }
    
    setupCollider(callback) {
        // Setup collider for physics - match the RuangGuru model scale
        console.log("[OrgScene4B] Loading collider...");
        
        // Use requestAnimationFrame for non-blocking clone
        requestAnimationFrame(() => {
            if (this.resources.items.collider && this.resources.items.collider.scene) {
                // Clone collider as well
                this.collider = this.resources.items.collider.scene.clone(true);
                this.collider.position.set(0, 0, 0);
                this.collider.rotation.set(0, 0, 0);
                this.collider.scale.set(12, 12, 12);

                // Make collider invisible (lightweight operation)
                this.collider.traverse((child) => {
                    if (child.isMesh) {
                        child.visible = false;
                    }
                });
                this.collidableGroup.add(this.collider);
            } else {
                console.error("[OrgScene4B] Collider not found!");
            }

            // Add the group to the scene
            this.scene.add(this.collidableGroup);

            // Build octree asynchronously to avoid blocking main thread
            // This is the heavy operation - do it in chunks using setTimeout
            console.log("[OrgScene4B] Building octree asynchronously...");
            
            // Defer octree building to next event loop tick
            setTimeout(() => {
                // Further defer to allow rendering
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        try {
                            this.octree.fromGraphNode(this.collidableGroup);
                            console.log("[OrgScene4B] Octree built successfully");

                            // Set collision objects for camera
                            if (this.experience.camera && this.experience.camera.controls) {
                                this.experience.camera.controls.collisionObjects = this.collider;
                                console.log("[OrgScene4B] Camera collision objects set");
                            }
                            
                            console.log("Organization Scene 4B (RuangGuru) loaded with full collision enabled.");
                            
                            // Call callback when done
                            if (callback) callback();
                        } catch (error) {
                            console.error("[OrgScene4B] Error building octree:", error);
                            if (callback) callback();
                        }
                    }, 100); // Small delay
                });
            }, 100); // Initial delay
        });
    }

    createPortals() {
        // Portal ke Westgate
        this.westgatePortal = new Portal(
            new THREE.Vector3(49, 2, 30),
            "westgate",
            new THREE.Vector3(0, 10, 0),
            "Westgate"
        );
    }

    createNPC() {
        console.log("[OrgScene4B] Creating Pembina NPC...");
        
        const guruModel = this.resources.items.guru;
        if (!guruModel) {
            console.error("[OrgScene4B] Guru model not found!");
            return;
        }

        // Create Pembina OSIS NPC
        this.npcPembina = SkeletonUtils.clone(guruModel.scene);
        this.npcPembina.position.set(8, -2, 25); // Position in RuangGuru - moved forward
        this.npcPembina.rotation.y = Math.PI + Math.PI / 2; // Rotate 90 degrees clockwise
        this.npcPembina.scale.set(9, 9, 9);
        this.scene.add(this.npcPembina);

        // Setup animations
        this.setupNPCAnimations();

        // Initialize UIManager
        this.uiManager = new UIManager();

        console.log("[OrgScene4B] Pembina NPC created successfully");
    }

    setupNPCAnimations() {
        // Clone animations from model - handle cases where model may not have animations
        if (!this.resources.items.guru || !this.resources.items.guru.animations) {
            console.warn("[OrgScene4B] Guru model has no animations, NPC will be static");
            return;
        }

        this.npcAnimations = this.resources.items.guru.animations.map((clip) => clip.clone());
        
        if (this.npcAnimations.length === 0) {
            console.warn("[OrgScene4B] No animations found for guru model");
            return;
        }

        this.npcMixer = new THREE.AnimationMixer(this.npcPembina);
        this.npcActions = {};
        
        // Try to find idle animation by name, or use first available animation as fallback
        const idleAnimation = this.npcAnimations.find(clip => 
            clip.name && clip.name.toLowerCase().includes('idle')
        ) || this.npcAnimations[0]; // Fallback to first animation if no idle found
        
        if (idleAnimation) {
            this.npcActions.idle = this.npcMixer.clipAction(idleAnimation);
            this.npcCurrentAction = this.npcActions.idle;
            this.npcCurrentAction.play();
        } else {
            console.warn("[OrgScene4B] Could not find any animation to play");
        }
    }

    checkPlayerProximity() {
        if (!this.experience.world.player || !this.experience.world.player.avatar || !this.npcPembina || !this.uiManager) {
            return;
        }

        const playerPos = this.experience.world.player.avatar.avatar.position;
        const npcPos = this.npcPembina.position;
        const distance = playerPos.distanceTo(npcPos);

        if (distance < 50 && !this.conversationStarted) {
            if (!this.isPlayerNear) {
                this.isPlayerNear = true;
                console.log("[OrgScene4B] Player near NPC");
            }
        } else {
            if (this.isPlayerNear && !this.conversationStarted) {
                this.isPlayerNear = false;
            }
        }
    }

    startConversation() {
        // Prevent double call
        if (this.conversationStarted) {
            console.log("[OrgScene4B] Conversation already started, skipping...");
            return;
        }
        
        console.log("[OrgScene4B] Starting conversation...");
        this.conversationStarted = true;

        this.createSimpleSpeechBubble();

        setTimeout(() => {
            console.log("[OrgScene4B] Showing choices...");
            this.showChoices();
        }, 6000);
    }

    createSimpleSpeechBubble() {
        const existingBubble = document.getElementById('pembina-speech-bubble');
        if (existingBubble) {
            existingBubble.remove();
        }

        this.create3DSpeechBubble();
    }

    create3DSpeechBubble() {
        this.speechBubbleGroup = new THREE.Group();
        
        const geometry = new THREE.PlaneGeometry(8, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: false,
            opacity: 1.0,
            side: THREE.FrontSide,
            depthWrite: false
        });
        this.speechBubblePlane = new THREE.Mesh(geometry, material);
        this.speechBubbleMaterial = material;
        
        const borderGeometry = new THREE.PlaneGeometry(8.2, 4.2);
        const borderMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: false,
            opacity: 1.0,
            side: THREE.FrontSide,
            depthWrite: false
        });
        this.speechBubbleBorder = new THREE.Mesh(borderGeometry, borderMaterial);
        
        const tailGeometry = new THREE.ConeGeometry(0.4, 1.2, 6);
        const tailMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: false,
            opacity: 1.0,
            depthWrite: false
        });
        this.speechBubbleArrow = new THREE.Mesh(tailGeometry, tailMaterial);
        this.speechBubbleArrow.rotation.x = Math.PI;
        this.speechBubbleArrow.position.set(-2.5, -2.5, 0);
        
        this.speechBubbleGroup.add(this.speechBubbleBorder);
        this.speechBubbleGroup.add(this.speechBubblePlane);
        this.speechBubbleGroup.add(this.speechBubbleArrow);
        
        this.createSpeechTextTexture();
        
        this.speechBubbleGroup.position.set(4, 16, 25); // Moved forward to match NPC position
        this.speechBubbleGroup.rotation.y = Math.PI + Math.PI / 2; // Rotate 90 degrees to match NPC
        
        this.scene.add(this.speechBubbleGroup);
        this.createAlternativeButton();
    }

    createSpeechTextTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1500;
        canvas.height = 750;
        const context = canvas.getContext('2d');
        
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        context.fillStyle = 'rgba(255, 255, 255, 1.0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.shadowColor = 'rgba(0, 0, 0, 0.8)';
        context.shadowBlur = 5;
        context.shadowOffsetX = 3;
        context.shadowOffsetY = 3;
        
        context.fillStyle = '#000000';
        context.strokeStyle = '#FFFFFF';
        context.lineWidth = 3;
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        context.strokeText('Pembina OSIS:', canvas.width / 2, 100);
        context.fillText('Pembina OSIS:', canvas.width / 2, 100);
        
        context.font = 'bold 36px Arial';
        
        // Dialog dari pembina - meminta laporan sementara karena ada perlengkapan tidak sesuai
        const dialogue = "Ada beberapa perlengkapan\nyang tidak sesuai.\nSaya perlu laporan keuangan\nsementara untuk melihat kondisi dana.";
        
        const lines = dialogue.split('\n');
        let y = 180;
        lines.forEach(line => {
            context.strokeText(line, canvas.width / 2, y);
            context.fillText(line, canvas.width / 2, y);
            y += 45;
        });
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const textMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: false,
            opacity: 1.0,
            side: THREE.FrontSide,
            depthWrite: false
        });
        
        this.speechBubblePlane.material = textMaterial;
    }

    createAlternativeButton() {
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

        document.body.appendChild(this.alternativeButton);
        
        const button = this.alternativeButton.querySelector('#read-speech-btn');
        button.addEventListener('click', () => {
            console.log("[OrgScene4B] Alternative button clicked!");
            // Play click sound
            if (this.experience && this.experience.soundManager) {
                this.experience.soundManager.play('click', 0.6);
            }
            this.showScreenSpeechBubble();
        });
    }

    showScreenSpeechBubble() {
        const screenBubble = document.createElement('div');
        screenBubble.id = 'screen-speech-bubble';
        screenBubble.innerHTML = `
            <div style="position: fixed; top: 20%; left: 50%; transform: translateX(-50%); background: white; border: 3px solid #333; border-radius: 20px; padding: 30px; max-width: 600px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); z-index: 10000001; cursor: pointer;">
                <div style="font-size: 24px; font-weight: bold; color: #000; margin-bottom: 15px; text-align: center;">
                    Pembina OSIS:
                </div>
                <div style="font-size: 18px; color: #000; line-height: 1.6; text-align: center;">
                    Ada beberapa perlengkapan yang tidak sesuai. Saya perlu laporan keuangan sementara untuk melihat kondisi dana.
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #666;">
                    Klik untuk menutup
                </div>
            </div>
        `;

        document.body.appendChild(screenBubble);
        
        screenBubble.addEventListener('click', () => {
            // Play click sound
            if (this.experience && this.experience.soundManager) {
                this.experience.soundManager.play('click', 0.6);
            }
            document.body.removeChild(screenBubble);
        });
    }

    onMouseMove(event) {
        if (!this.speechBubbleGroup) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
        const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);

        // Show tooltip when hovering over speech bubble
        if (intersects.length > 0) {
            if (!this.speechBubbleTooltip) {
                this.speechBubbleTooltip = document.createElement('div');
                this.speechBubbleTooltip.textContent = 'Klik untuk melihat dialog di layar';
                this.speechBubbleTooltip.style.cssText = `
                    position: fixed;
                    top: ${event.clientY - 40}px;
                    left: ${event.clientX}px;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 5px;
                    font-size: 12px;
                    pointer-events: none;
                    z-index: 10000002;
                `;
                document.body.appendChild(this.speechBubbleTooltip);
            }
            this.speechBubbleTooltip.style.top = `${event.clientY - 40}px`;
            this.speechBubbleTooltip.style.left = `${event.clientX}px`;
        } else {
            if (this.speechBubbleTooltip) {
                this.speechBubbleTooltip.remove();
                this.speechBubbleTooltip = null;
            }
        }
    }

    onMouseClick(event) {
        if (!this.speechBubbleGroup) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
        const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);

        if (intersects.length > 0) {
            this.showScreenSpeechBubble();
        }
    }

    showChoices() {
        console.log("[OrgScene4B] Creating choice panel...");
        
        // Remove existing choice panel if any
        if (this.choicePanel) {
            this.choicePanel.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'choice-panel';
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

        panel.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(20,20,20,0.95)); border: 3px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 25px; min-width: 450px; box-shadow: 0 8px 32px rgba(0,0,0,0.8);">
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <button id="choice-A" style="display: flex; align-items: center; gap: 15px; padding: 18px 22px; background: rgba(76,175,80,0.15); border: 2px solid rgba(76,175,80,0.5); border-radius: 12px; color: white; cursor: pointer; transition: all 0.3s ease; text-align: left; font-size: 16px;">
                        <span style="font-size: 24px; font-weight: bold; min-width: 35px; text-align: center; color: #4caf50;">A</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 17px; line-height: 1.3;">Memberikan laporan secara transparan dan ketahuan</div>
                        </div>
                    </button>
                    <button id="choice-B" style="display: flex; align-items: center; gap: 15px; padding: 18px 22px; background: rgba(244,67,54,0.15); border: 2px solid rgba(244,67,54,0.5); border-radius: 12px; color: white; cursor: pointer; transition: all 0.3s ease; text-align: left; font-size: 16px;">
                        <span style="font-size: 24px; font-weight: bold; min-width: 35px; text-align: center; color: #f44336;">B</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 17px; line-height: 1.3;">Manipulasi laporan dana dan persiapan kembali dilanjutkan</div>
                        </div>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // Fade in
        setTimeout(() => {
            panel.style.opacity = '1';
        }, 100);

        // Add event listeners
        document.getElementById('choice-A').addEventListener('click', () => {
            console.log("[OrgScene4B] Player chose A");
            // Play click sound
            if (this.experience && this.experience.soundManager) {
                this.experience.soundManager.play('click', 0.6);
            }
            this.handleChoice('A');
        });

        document.getElementById('choice-B').addEventListener('click', () => {
            console.log("[OrgScene4B] Player chose B");
            // Play click sound
            if (this.experience && this.experience.soundManager) {
                this.experience.soundManager.play('click', 0.6);
            }
            this.handleChoice('B');
        });

        // Add hover effects
        const choiceA = document.getElementById('choice-A');
        const choiceB = document.getElementById('choice-B');
        
        choiceA.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(76,175,80,0.3)';
            this.style.borderColor = 'rgba(76,175,80,0.8)';
            this.style.transform = 'scale(1.02)';
        });
        choiceA.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(76,175,80,0.15)';
            this.style.borderColor = 'rgba(76,175,80,0.5)';
            this.style.transform = 'scale(1)';
        });

        choiceB.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(244,67,54,0.3)';
            this.style.borderColor = 'rgba(244,67,54,0.8)';
            this.style.transform = 'scale(1.02)';
        });
        choiceB.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(244,67,54,0.15)';
            this.style.borderColor = 'rgba(244,67,54,0.5)';
            this.style.transform = 'scale(1)';
        });

        this.choicePanel = panel;
    }

    handleChoice(choiceId) {
        console.log(`[OrgScene4B] Player chose: ${choiceId}`);

        let scoreIncrease = 0;

        if (choiceId === 'A') {
            // Pilihan A: Memberikan laporan transparan
            scoreIncrease = 10;
        } else if (choiceId === 'B') {
            // Pilihan B: Manipulasi laporan dana
            scoreIncrease = 25;
        }

        // Update corruption score via ScoreManager and show at ending
        if (this.experience && this.experience.scoreManager) {
            this.experience.scoreManager.addScore(scoreIncrease);
            console.log(`[OrgScene4B] ScoreManager total score: ${this.experience.scoreManager.getScore()}%`);
        }

        // Remove UI elements
        if (this.choicePanel) {
            this.choicePanel.remove();
            this.choicePanel = null;
        }

        // Show supplement message
        this.showSupplementMessage();
    }

    showSupplementMessage() {
        const message = document.createElement('div');
        message.id = 'supplement-message';
        message.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(255,152,0,0.95), rgba(255,193,7,0.95)); border: 3px solid rgba(255,255,255,0.5); border-radius: 20px; padding: 30px; max-width: 600px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #fff; margin-bottom: 15px;">
                    💭 Pesan
                </div>
                <div style="font-size: 18px; color: #fff; line-height: 1.6; font-style: italic;">
                    "Setiap laporan yang dipoles bukan menutupi keburukan, tapi menunda kejatuhan."
                </div>
            </div>
        `;

        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000001;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.style.opacity = '1';
        }, 100);

        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(message)) {
                    document.body.removeChild(message);
                }
                
                // Tampilkan ending setelah supplement message ditutup
                console.log("[OrgScene4B] Showing ending...");
                if (this.experience && this.experience.scoreManager) {
                    this.experience.scoreManager.enableScoreUI();
                }
                this.showEnding();
            }, 500);
        }, 5000);
    }

    showEnding() {
        // Import dan tampilkan ending
        const ending = new Ending();
        ending.show().then(() => {
            console.log("[OrgScene4B] Ending displayed");
        }).catch((error) => {
            console.error("[OrgScene4B] Error showing ending:", error);
        });
    }

    update() {
        if (this.westgatePortal) {
            this.westgatePortal.update();
        }

        if (this.npcMixer) {
            this.npcMixer.update(this.experience.time.delta * 0.001);
        }

        this.checkPlayerProximity();

        if (this.uiManager) {
            this.uiManager.updatePositions();
        }
    }

    dispose() {
        console.log("[OrganizationScene4B] Disposing...");

        if (this.canvas) {
            this.canvas.removeEventListener('click', this.onMouseClick.bind(this));
            this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
        }

        if (this.alternativeButton) {
            this.alternativeButton.remove();
            this.alternativeButton = null;
        }

        if (this.choicePanel) {
            this.choicePanel.remove();
            this.choicePanel = null;
        }

        if (this.speechBubbleGroup) {
            this.scene.remove(this.speechBubbleGroup);
            this.speechBubbleGroup = null;
        }

        if (this.speechBubbleTooltip) {
            this.speechBubbleTooltip.remove();
            this.speechBubbleTooltip = null;
        }

        if (this.screenBubble) {
            this.screenBubble.remove();
            this.screenBubble = null;
        }

        if (this.openingStory) {
            this.openingStory.dispose();
            this.openingStory = null;
        }

        if (this.uiManager) {
            this.uiManager.dispose();
            this.uiManager = null;
        }

        if (this.npcPembina) {
            this.scene.remove(this.npcPembina);
            this.npcPembina = null;
        }
        
        if (this.npcMixer) {
            this.npcMixer.stopAllAction();
            this.npcMixer = null;
        }

        if (this.westgatePortal) {
            this.westgatePortal.dispose();
            this.westgatePortal = null;
        }

        // Clean up loading indicator
        if (this.loadingIndicator) {
            this.hideLoadingIndicator();
        }

        // Clean up model from scene
        if (this.ruangGuruModel && this.ruangGuruModel.parent) {
            this.scene.remove(this.ruangGuruModel.parent);
        }
    }
}
