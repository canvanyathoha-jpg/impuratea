import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import Portal from "../Portal.js";
import UIManager from "../../Utils/UIManager.js";
import OpeningStory, { SCENE_DATA } from "../../Utils/OpeningStory.js";
import AIVoice from "../../Utils/AIVoice.js";

export default class OrganizationScene2B {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.npcSenior = null;
        this.npcKetua = null;
        this.uiManager = null;
        this.isPlayerNear = false;
        this.conversationStarted = false;

        // Stop any existing AI Voice from previous scenes
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        // Initialize AI Voice for this scene
        this.aiVoice = new AIVoice();

        // Track AI voice timeout to clear on dispose
        this.aiVoiceTimeout = null;

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
        console.log("[OrgScene2B] Loading scene in background first...");
        
        // Show loading indicator
        this.showLoadingIndicator();
        
        // Load scene models asynchronously (non-blocking)
        this.loadSceneAsync().then(() => {
            console.log("[OrgScene2B] Scene loaded successfully!");
            
            // Hide loading indicator
            this.hideLoadingIndicator();
            
            // Show opening story overlay immediately (no delay)
            console.log("[OrgScene2B] Scene loaded, now showing opening story overlay...");
            
            try {
                this.openingStory = new OpeningStory(SCENE_DATA.og_scene2b);
                
                // Show opening story overlay (blocks screen with z-index 10000000)
                this.openingStory.show().then(() => {
                    console.log("[OrgScene2B] Opening story dismissed - scene is now fully visible");
                }).catch((error) => {
                    console.error("[OrgScene2B] Error in opening story:", error);
                });
            } catch (error) {
                console.error("[OrgScene2B] Error creating opening story:", error);
            }
        }).catch((error) => {
            console.error("[OrgScene2B] Error loading scene:", error);
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
        console.log("[OrgScene2B] Ensuring player is spawned...");
        
        // Use requestAnimationFrame untuk non-blocking - no delay needed
        requestAnimationFrame(() => {
            if (this.experience.world && this.experience.world.player) {
                // Get spawn point for this scene
                const spawnPoint = this.experience.world.spawnPoints?.og_scene2b || new THREE.Vector3(-5, 10, 20);
                console.log("[OrgScene2B] Setting player spawn point to:", spawnPoint);
                
                // Set spawn point (single call, let Player.js handle it)
                this.experience.world.player.setSpawnPoint(spawnPoint);
                
                // Ensure avatar is visible and in scene (lightweight check)
                if (this.experience.world.player.avatar?.avatar) {
                    this.experience.world.player.avatar.avatar.visible = true;
                    
                    // Only add to scene if not already there
                    if (!this.experience.world.player.avatar.avatar.parent) {
                        this.scene.add(this.experience.world.player.avatar.avatar);
                        console.log("[OrgScene2B] Player avatar added to scene");
                    }
                }
            } else {
                console.warn("[OrgScene2B] Player not found in world!");
            }
        });
    }

    setWorld() {
        // Synchronous version (backward compatibility)
        this.setWorldAsync(() => {});
    }

    setWorldAsync(callback) {
        console.log("[OrgScene2B] setWorldAsync() called");
        
        // Create a group for all collidable objects
        this.collidableGroup = new THREE.Group();

        // Load the organization model - 7x scale (same as scene1)
        console.log("[OrgScene2B] Loading organization model...");
        
        // Clone model if already loaded to avoid re-parsing
        // Use requestAnimationFrame to avoid blocking during clone
        requestAnimationFrame(() => {
            if (this.resources.items.organization && this.resources.items.organization.scene) {
                // Use clone to avoid mutating the original
                // Clone is done in animation frame to avoid blocking
                this.organizationModel = this.resources.items.organization.scene.clone(true);
                this.organizationModel.position.set(0, 0, 0);
                this.organizationModel.rotation.set(0, 0, 0);
                this.organizationModel.scale.set(7, 7, 7);
                this.collidableGroup.add(this.organizationModel);
                
                // Continue with collider setup
                this.setupCollider(callback);
            } else {
                console.error("[OrgScene2B] Organization model not found!");
                if (callback) callback();
            }
        });
    }
    
    setupCollider(callback) {
        // Setup collider for physics - match the organization model scale
        console.log("[OrgScene2B] Loading collider...");
        
        // Use requestAnimationFrame for non-blocking clone
        requestAnimationFrame(() => {
            if (this.resources.items.collider && this.resources.items.collider.scene) {
                // Clone collider as well
                this.collider = this.resources.items.collider.scene.clone(true);
                this.collider.position.set(0, 0, 0);
                this.collider.rotation.set(0, 0, 0);
                this.collider.scale.set(7, 7, 7);

                // Make collider invisible (lightweight operation)
                this.collider.traverse((child) => {
                    if (child.isMesh) {
                        child.visible = false;
                    }
                });
                this.collidableGroup.add(this.collider);
            } else {
                console.error("[OrgScene2B] Collider not found!");
            }

            // Add the group to the scene
            this.scene.add(this.collidableGroup);

            // Build octree asynchronously to avoid blocking main thread
            // This is the heavy operation - do it in chunks using setTimeout
            console.log("[OrgScene2B] Building octree asynchronously...");
            
            // Defer octree building to next event loop tick
            setTimeout(() => {
                // Further defer to allow rendering
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        try {
                            this.octree.fromGraphNode(this.collidableGroup);
                            console.log("[OrgScene2B] Octree built successfully");

                            // Set collision objects for camera
                            if (this.experience.camera && this.experience.camera.controls) {
                                this.experience.camera.controls.collisionObjects = this.collider;
                                console.log("[OrgScene2B] Camera collision objects set");
                            }
                            
                            console.log("Organization Scene 2B loaded with full collision enabled.");
                            
                            // Call callback when done
                            if (callback) callback();
                        } catch (error) {
                            console.error("[OrgScene2B] Error building octree:", error);
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
            new THREE.Vector3(68, 2, 42),
            "westgate",
            new THREE.Vector3(0, 10, 0),
            "Westgate"
        );
    }

    createNPCs() {
        console.log("[OrgScene2B] Creating NPCs...");
        
        // Load male model
        const maleModel = this.resources.items.male;
        if (!maleModel) {
            console.error("[OrgScene2B] Male avatar model not found!");
            return;
        }

        // Create Senior NPC
        this.npcSenior = SkeletonUtils.clone(maleModel.scene);
        this.npcSenior.position.set(8, -2, 21);
        this.npcSenior.rotation.y = Math.PI;
        this.npcSenior.scale.set(9, 9, 9);
        this.scene.add(this.npcSenior);

        // Create Ketua OSIS NPC
        this.npcKetua = SkeletonUtils.clone(maleModel.scene);
        this.npcKetua.position.set(12, -2, 21);
        this.npcKetua.rotation.y = Math.PI;
        this.npcKetua.scale.set(9, 9, 9);
        this.scene.add(this.npcKetua);

        // Setup animations for both NPCs
        this.setupNPCAnimations();

        // Initialize UIManager
        this.uiManager = new UIManager();

        console.log("[OrgScene2B] NPCs created successfully");
    }

    setupNPCAnimations() {
        this.npcAnimations = this.resources.items.male.animations.map((clip) => clip.clone());
        
        // Setup Senior animation mixer
        this.npcMixerSenior = new THREE.AnimationMixer(this.npcSenior);
        this.npcActionsSenior = {};
        this.npcActionsSenior.idle = this.npcMixerSenior.clipAction(this.npcAnimations[1]);
        this.npcCurrentActionSenior = this.npcActionsSenior.idle;
        this.npcCurrentActionSenior.play();

        // Setup Ketua animation mixer
        this.npcMixerKetua = new THREE.AnimationMixer(this.npcKetua);
        this.npcActionsKetua = {};
        this.npcActionsKetua.idle = this.npcMixerKetua.clipAction(this.npcAnimations[1]);
        this.npcCurrentActionKetua = this.npcActionsKetua.idle;
        this.npcCurrentActionKetua.play();
    }

    checkPlayerProximity() {
        if (!this.experience.world.player || !this.experience.world.player.avatar || !this.npcSenior || !this.uiManager) {
            return;
        }

        const playerPos = this.experience.world.player.avatar.avatar.position;
        const npcPos = this.npcSenior.position;
        const distance = playerPos.distanceTo(npcPos);

        if (distance < 50 && !this.conversationStarted) {
            if (!this.isPlayerNear) {
                this.isPlayerNear = true;
                console.log("[OrgScene2B] Player near NPC, starting conversation automatically");
                this.startConversation();
            }
        } else {
            if (this.isPlayerNear && !this.conversationStarted) {
                this.isPlayerNear = false;
            }
        }
    }

    startConversation() {
        console.log("[OrgScene2B] Starting conversation...");
        this.conversationStarted = true;

        this.createSimpleSpeechBubble();

        setTimeout(() => {
            console.log("[OrgScene2B] Showing choices...");
            this.showChoices();
        }, 6000);
    }

    createSimpleSpeechBubble() {
        const existingBubble = document.getElementById('senior-speech-bubble');
        if (existingBubble) {
            existingBubble.remove();
        }

        this.create3DSpeechBubble();

        // Speak the dialogue with AI voice after a delay
        // Clear any existing timeout first
        if (this.aiVoiceTimeout) {
            clearTimeout(this.aiVoiceTimeout);
        }

        this.aiVoiceTimeout = setTimeout(() => {
            if (this.aiVoice) { // Check if AI voice still exists (scene not disposed)
                const dialogue = "Kenapa bendahara memberikan uang ke Ketua OSIS dan Senior? Apa yang terjadi?";
                this.aiVoice.speak(dialogue);
            }
        }, 1000); // 1 second delay after speech bubble appears
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
        
        this.speechBubbleGroup.position.set(4, 16, 21);
        this.speechBubbleGroup.rotation.y = Math.PI;
        
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
        
        // Dialog dari Pembina OSIS
        const dialogue = "Kenapa bendahara memberikan uang\nke Ketua OSIS dan Senior?\nApa yang terjadi?";
        
        const lines = dialogue.split('\n');
        let y = 180;
        lines.forEach(line => {
            context.strokeText(line, canvas.width / 2, y);
            context.fillText(line, canvas.width / 2, y);
            y += 50;
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
        
        const textGeometry = new THREE.PlaneGeometry(7.8, 3.8);
        this.speechTextPlane = new THREE.Mesh(textGeometry, textMaterial);
        this.speechTextPlane.position.z = 0.01;
        
        this.speechBubbleGroup.add(this.speechTextPlane);
    }

    createAlternativeButton() {
        this.alternativeButton = document.createElement('div');
        this.alternativeButton.id = 'alternative-speech-button';
        this.alternativeButton.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; z-index: 10000001;">
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
                ">
                    💬 Baca Percakapan
                </button>
            </div>
        `;

        document.body.appendChild(this.alternativeButton);
        
        const button = this.alternativeButton.querySelector('#read-speech-btn');
        button.addEventListener('click', () => {
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
                    Kenapa bendahara memberikan uang ke Ketua OSIS dan Senior? Apa yang terjadi?
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

        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
        const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);
        
        if (intersects.length > 0) {
            this.canvas.style.cursor = 'pointer';
            if (this.speechBubbleGroup.scale.x === 1) {
                this.speechBubbleGroup.scale.set(1.05, 1.05, 1.05);
                this.speechBubbleMaterial.color.setHex(0xf0f0f0);
            }
        } else {
            this.canvas.style.cursor = 'default';
            if (this.speechBubbleGroup.scale.x === 1.05) {
                this.speechBubbleGroup.scale.set(1, 1, 1);
                this.speechBubbleMaterial.color.setHex(0xffffff);
            }
        }
    }

    onMouseClick(event) {
        if (!this.speechBubbleGroup) return;

        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
        const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);
        
        if (intersects.length > 0) {
            this.speechBubbleGroup.scale.set(0.95, 0.95, 0.95);
            setTimeout(() => {
                this.speechBubbleGroup.scale.set(1.05, 1.05, 1.05);
            }, 100);
            this.showScreenSpeechBubble();
        }
    }

    showChoices() {
        console.log("[OrgScene2B] Creating choice panel...");
        
        const existingPanel = document.getElementById('choice-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'choice-panel';
        panel.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(20,20,20,0.95)); border: 3px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 25px; min-width: 450px; box-shadow: 0 8px 32px rgba(0,0,0,0.8);">
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <button id="choice-A" style="display: flex; align-items: center; gap: 15px; padding: 18px 22px; background: rgba(76,175,80,0.15); border: 2px solid rgba(76,175,80,0.5); border-radius: 12px; color: white; cursor: pointer; transition: all 0.3s ease; text-align: left; font-size: 16px;">
                        <span style="font-size: 24px; font-weight: bold; min-width: 35px; text-align: center; color: #4caf50;">A</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 17px; line-height: 1.3;">Jujur dan dihukum Pembina</div>
                        </div>
                    </button>
                    <button id="choice-B" style="display: flex; align-items: center; gap: 15px; padding: 18px 22px; background: rgba(244,67,54,0.15); border: 2px solid rgba(244,67,54,0.5); border-radius: 12px; color: white; cursor: pointer; transition: all 0.3s ease; text-align: left; font-size: 16px;">
                        <span style="font-size: 24px; font-weight: bold; min-width: 35px; text-align: center; color: #f44336;">B</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 17px; line-height: 1.3;">Berbohong dan tidak dicurigai Pembina</div>
                        </div>
                    </button>
                </div>
            </div>
        `;

        panel.style.cssText = `
            position: fixed;
            bottom: 20%;
            left: 50%;
            transform: translate(-50%, 0);
            z-index: 10000000;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;

        document.body.appendChild(panel);

        setTimeout(() => {
            panel.style.opacity = '1';
        }, 100);

        // Add event listeners for choices
        document.getElementById('choice-A').addEventListener('click', () => {
            console.log("[OrgScene2B] Player chose A");
            // Play click sound
            if (this.experience && this.experience.soundManager) {
                this.experience.soundManager.play('click', 0.6);
            }
            this.handleChoice('A');
        });

        document.getElementById('choice-B').addEventListener('click', () => {
            console.log("[OrgScene2B] Player chose B");
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
        console.log(`[OrgScene2B] Player chose: ${choiceId}`);

        let scoreIncrease = 0;
        let nextScene = null;

        if (choiceId === 'A') {
            // Pilihan A: Jujur → Scene 3A
            scoreIncrease = 10;
            nextScene = 'og_scene3a';
            console.log(`[OrgScene2B] Choice A → Load og_scene3a`);
        } else if (choiceId === 'B') {
            // Pilihan B: Berbohong → Scene 3B
            scoreIncrease = 20;
            nextScene = 'og_scene3b';
            console.log(`[OrgScene2B] Choice B → Load og_scene3b`);
        }

        // Update corruption score via ScoreManager
        if (this.experience && this.experience.scoreManager) {
            this.experience.scoreManager.addScore(scoreIncrease);
            console.log(`[OrgScene2B] ScoreManager total score: ${this.experience.scoreManager.getScore()}%`);
        }

        // Remove UI elements
        if (this.choicePanel) {
            this.choicePanel.remove();
            this.choicePanel = null;
        }

        // Show supplement message
        this.showSupplementMessage();

        // Load next scene if any
        if (nextScene) {
            setTimeout(() => {
                this.loadScene(nextScene);
            }, 5500); // Wait for message to show
        }
    }

    loadScene(sceneName) {
        console.log(`[OrgScene2B] Loading scene: ${sceneName}`);
        
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

        setTimeout(() => fadeDiv.style.opacity = '1', 10);

        setTimeout(() => {
            console.log(`[OrgScene2B] Switching to scene: ${sceneName}`);
            const newUrl = `${window.location.origin}${window.location.pathname}?scene=${sceneName}`;
            window.location.href = newUrl;
        }, 500);
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
                    "Kebohongan yang menyelamatkanmu hari ini, sedang menyiapkan kebinasaan untuk besok."
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
            }, 500);
        }, 5000);
    }

    update() {
        if (this.westgatePortal) {
            this.westgatePortal.update();
        }

        if (this.npcMixerSenior) {
            this.npcMixerSenior.update(this.experience.time.delta * 0.001);
        }

        if (this.npcMixerKetua) {
            this.npcMixerKetua.update(this.experience.time.delta * 0.001);
        }

        this.checkPlayerProximity();

        if (this.uiManager) {
            this.uiManager.updatePositions();
        }
    }

    dispose() {
        console.log("[OrganizationScene2B] Disposing...");

        // Clear AI voice timeout to prevent delayed speech in next scene
        if (this.aiVoiceTimeout) {
            clearTimeout(this.aiVoiceTimeout);
            this.aiVoiceTimeout = null;
        }

        // Dispose AI Voice
        if (this.aiVoice) {
            this.aiVoice.dispose();
            this.aiVoice = null;
        }

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

        if (this.openingStory) {
            this.openingStory.dispose();
            this.openingStory = null;
        }

        if (this.uiManager) {
            this.uiManager.dispose();
            this.uiManager = null;
        }

        if (this.npcSenior) {
            this.scene.remove(this.npcSenior);
            this.npcSenior = null;
        }

        if (this.npcKetua) {
            this.scene.remove(this.npcKetua);
            this.npcKetua = null;
        }
        
        if (this.npcMixerSenior) {
            this.npcMixerSenior.stopAllAction();
            this.npcMixerSenior = null;
        }

        if (this.npcMixerKetua) {
            this.npcMixerKetua.stopAllAction();
            this.npcMixerKetua = null;
        }

        if (this.westgatePortal) {
            this.westgatePortal.dispose();
            this.westgatePortal = null;
        }

        if (this.organizationModel && this.organizationModel.parent) {
            this.scene.remove(this.organizationModel.parent);
        }

        // Clean up loading indicator
        if (this.loadingIndicator) {
            this.hideLoadingIndicator();
        }

        console.log("[OrganizationScene2B] Disposed");
    }
}
