import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import Portal from "../Portal.js";
import UIManager from "../../Utils/UIManager.js";
import OpeningStory, { SCENE_DATA } from "../../Utils/OpeningStory.js";
import Ending from "../../Utils/Ending.js";
import AIVoice from "../../Utils/AIVoice.js";
import SceneLoadingIndicator from "../../Utils/SceneLoadingIndicator.js";
import { languageManager } from "../../Utils/LanguageManager.js";
import { ORG_TEXTS } from "./OrganizationTexts.js";

// Post-processing imports for professional visual effects
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export default class OrganizationScene4A {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.npcPembina = null;
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
        this.pendingDialogue = null;
        this.hasSpokenDialogue = false;
        
        // Professional rendering features
        this.composer = null;
        this.lights = {};
        this.particleSystems = [];
        this.environmentalEffects = {};
        this.cameraAnimations = [];

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
        console.log("[OrgScene4A] Initializing with opening story...");
        this.loadingIndicator = SceneLoadingIndicator.show();

        // Wait for resources to be ready before loading scene
        const waitForResources = () => {
            if (this.resources.isReady) {
                console.log("[OrgScene4A] ✅ Resources ready, starting scene load...");
                this.loadSceneAsync().then(() => {
                    console.log("[OrgScene4A] ✅ Scene loaded successfully!");
                    SceneLoadingIndicator.hide();

                    // Show opening story
                    this.openingStory = new OpeningStory(SCENE_DATA.og_scene4a);
                    this.openingStory.show().then(() => {
                        console.log("[OrgScene4A] Opening story dismissed");

                        // Auto-start conversation after opening story
                        setTimeout(() => {
                            console.log("[OrgScene4A] Auto-starting conversation...");
                            this.startConversation();
                        }, 2000);
                    }).catch((error) => {
                        console.error("[OrgScene4A] Error in opening story:", error);
                    });
                }).catch((error) => {
                    console.error("[OrgScene4A] ❌ Error loading scene:", error);
                    SceneLoadingIndicator.hide();
                });
            } else {
                console.log("[OrgScene4A] ⏳ Waiting for resources to be ready...");
                this.resources.once('ready', () => {
                    console.log("[OrgScene4A] ✅ Resources ready event fired!");
                    waitForResources();
                });
            }
        };

        waitForResources();
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
        console.log("[OrgScene4A] Ensuring player is spawned...");
        
        // Use requestAnimationFrame untuk non-blocking - no delay needed
        requestAnimationFrame(() => {
            if (this.experience.world && this.experience.world.player) {
                // Get spawn point for this scene
                const spawnPoint = this.experience.world.spawnPoints?.og_scene4a || new THREE.Vector3(-5, 10, 20);
                console.log("[OrgScene4A] Setting player spawn point to:", spawnPoint);
                
                // Set spawn point (single call, let Player.js handle it)
                this.experience.world.player.setSpawnPoint(spawnPoint);
                
                // Ensure avatar is visible and in scene (lightweight check)
                if (this.experience.world.player.avatar?.avatar) {
                    this.experience.world.player.avatar.avatar.visible = true;
                    
                    // Only add to scene if not already there
                    if (!this.experience.world.player.avatar.avatar.parent) {
                        this.scene.add(this.experience.world.player.avatar.avatar);
                        console.log("[OrgScene4A] Player avatar added to scene");
                    }
                }
            } else {
                console.warn("[OrgScene4A] Player not found in world!");
            }
        });
    }

    setWorld() {
        // Synchronous version (backward compatibility)
        this.setWorldAsync(() => {});
    }

    setWorldAsync(callback) {
        console.log("[OrgScene4A] setWorldAsync() called");
        
        // Create a group for all collidable objects
        this.collidableGroup = new THREE.Group();

        // Load the RuangGuru model
        console.log("[OrgScene4A] Loading RuangGuru model...");
        
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
                
                // Enhance materials before continuing
                this.enhanceMaterials();
                
                // Continue with collider setup
                this.setupCollider(callback);
            } else {
                console.error("[OrgScene4A] RuangGuru model not found!");
                if (callback) callback();
            }
        });
    }
    
    setupCollider(callback) {
        // Setup collider for physics - match the RuangGuru model scale
        console.log("[OrgScene4A] Loading collider...");
        
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
                console.error("[OrgScene4A] Collider not found!");
            }

            // Add the group to the scene
            this.scene.add(this.collidableGroup);

            // Build octree asynchronously to avoid blocking main thread
            // This is the heavy operation - do it in chunks using setTimeout
            console.log("[OrgScene4A] Building octree asynchronously...");
            
            // Defer octree building to next event loop tick
            setTimeout(() => {
                // Further defer to allow rendering
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        try {
                            this.octree.fromGraphNode(this.collidableGroup);
                            console.log("[OrgScene4A] Octree built successfully");

                            // Set collision objects for camera
                            if (this.experience.camera && this.experience.camera.controls) {
                                this.experience.camera.controls.collisionObjects = this.collider;
                                console.log("[OrgScene4A] Camera collision objects set");
                            }
                            
                            console.log("Organization Scene 4A (RuangGuru) loaded with full collision enabled.");
                            
                            // Setup professional lighting and effects
                            this.setupProfessionalLighting();
                            this.setupAtmosphericEffects();
                            this.setupPostProcessing();
                            
                            // Call callback when done
                            if (callback) callback();
                        } catch (error) {
                            console.error("[OrgScene4A] Error building octree:", error);
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
        console.log("[OrgScene4A] Creating Pembina NPC...");
        
        const guruModel = this.resources.items.guru;
        if (!guruModel) {
            console.error("[OrgScene4A] Guru model not found!");
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

        console.log("[OrgScene4A] Pembina NPC created successfully");
    }

    setupNPCAnimations() {
        // Clone animations from model - handle cases where model may not have animations
        if (!this.resources.items.guru || !this.resources.items.guru.animations) {
            console.warn("[OrgScene4A] Guru model has no animations, NPC will be static");
            return;
        }

        this.npcAnimations = this.resources.items.guru.animations.map((clip) => clip.clone());
        
        if (this.npcAnimations.length === 0) {
            console.warn("[OrgScene4A] No animations found for guru model");
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
            console.warn("[OrgScene4A] Could not find any animation to play");
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
                console.log("[OrgScene4A] Player near NPC");
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
            console.log("[OrgScene4A] Conversation already started, skipping...");
            return;
        }
        
        console.log("[OrgScene4A] Starting conversation...");
        this.conversationStarted = true;

        this.createSimpleSpeechBubble();

        setTimeout(() => {
            console.log("[OrgScene4A] Showing choices...");
            this.showChoices();
        }, 6000);
    }

    createSimpleSpeechBubble() {
        const existingBubble = document.getElementById('pembina-speech-bubble');
        if (existingBubble) {
            existingBubble.remove();
        }

        this.create3DSpeechBubble();

        // Clear any existing timeout first
        if (this.aiVoiceTimeout) {
            clearTimeout(this.aiVoiceTimeout);
        }

                const dialogue = languageManager.translate(ORG_TEXTS.scene4a.dialogue);
        this.pendingDialogue = dialogue;
        this.hasSpokenDialogue = false;

        const userCanAutoPlay = !!(navigator.userActivation && (navigator.userActivation.isActive || navigator.userActivation.hasBeenActive));

        // Speak the dialogue with AI voice after a delay
        if (userCanAutoPlay) {
            this.aiVoiceTimeout = setTimeout(() => {
                this.playPendingDialogue();
        }, 1000); // 1 second delay after speech bubble appears
        } else {
            console.warn("[OrgScene4A] Skipping auto speech (browser requires user interaction). Click the bubble to play audio.");
        }
    }

    playPendingDialogue() {
        if (!this.aiVoice || !this.pendingDialogue || this.hasSpokenDialogue) {
            return;
        }
        this.aiVoice.speak(this.pendingDialogue);
        this.hasSpokenDialogue = true;
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

        // Add tooltip for speech bubble interaction
        this.createSpeechBubbleTooltip();
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
        
        const speakerName = languageManager.translate(ORG_TEXTS.scene4a.speaker) + ':';
        context.strokeText(speakerName, canvas.width / 2, 100);
        context.fillText(speakerName, canvas.width / 2, 100);

        context.font = 'bold 36px Arial';

        // Dialog dari pembina - marah karena tidak ada vendor - Bilingual
        const dialogue = languageManager.getLanguage() === 'id' ?
            "Kamu tidak bisa menemukan vendor!\nSaya perlu laporan keuangan\nuntuk melihat keberlangsungan\nacara ke depannya." :
            "You couldn't find a vendor!\nI need the financial report\nto see the sustainability\nof the event going forward.";

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

    setupProfessionalLighting() {
        console.log("[OrgScene4A] Setting up cinematic dark lighting system...");

        // Enable shadows for renderer with cinematic settings
        if (this.experience.renderer && this.experience.renderer.instance) {
            this.experience.renderer.instance.shadowMap.enabled = true;
            this.experience.renderer.instance.shadowMap.type = THREE.PCFSoftShadowMap;
            this.experience.renderer.instance.toneMapping = THREE.CineonToneMapping; // Cinematic tone mapping
            this.experience.renderer.instance.toneMappingExposure = 0.6; // Darker exposure for drama
        }

        // 1. Very low ambient light for dark atmosphere (AAA-quality darkness)
        this.lights.ambient = new THREE.AmbientLight(0x1a1a2e, 0.15);
        this.scene.add(this.lights.ambient);

        // 2. Main directional light (cool moonlight/dramatic key light)
        this.lights.directional = new THREE.DirectionalLight(0x6b7c9c, 0.8);
        this.lights.directional.position.set(40, 60, 20);
        this.lights.directional.castShadow = true;

        // Ultra high-quality shadow settings for cinematic look
        this.lights.directional.shadow.mapSize.width = 8192;
        this.lights.directional.shadow.mapSize.height = 8192;
        this.lights.directional.shadow.camera.near = 1;
        this.lights.directional.shadow.camera.far = 200;
        this.lights.directional.shadow.camera.left = -100;
        this.lights.directional.shadow.camera.right = 100;
        this.lights.directional.shadow.camera.top = 100;
        this.lights.directional.shadow.camera.bottom = -100;
        this.lights.directional.shadow.bias = -0.00005;
        this.lights.directional.shadow.normalBias = 0.01;
        this.lights.directional.shadow.radius = 2; // Soft shadows

        this.scene.add(this.lights.directional);

        // 3. Dark hemisphere light for moody atmosphere
        this.lights.hemisphere = new THREE.HemisphereLight(0x2c3e50, 0x1a1a2e, 0.3);
        this.scene.add(this.lights.hemisphere);

        // 4. Accent point lights with color (cinematic blue/orange contrast)
        const pointLight1 = new THREE.PointLight(0xff6b35, 1.8, 50); // Warm orange
        pointLight1.position.set(10, 12, 10);
        pointLight1.castShadow = true;
        pointLight1.shadow.mapSize.width = 2048;
        pointLight1.shadow.mapSize.height = 2048;
        this.scene.add(pointLight1);
        this.lights.point1 = pointLight1;

        const pointLight2 = new THREE.PointLight(0x4A90E2, 1.8, 50); // Cool blue
        pointLight2.position.set(-10, 12, 10);
        pointLight2.castShadow = true;
        pointLight2.shadow.mapSize.width = 2048;
        pointLight2.shadow.mapSize.height = 2048;
        this.scene.add(pointLight2);
        this.lights.point2 = pointLight2;

        // 5. Dramatic rim light for character separation
        this.lights.rim = new THREE.DirectionalLight(0x8badd6, 0.6);
        this.lights.rim.position.set(-30, 40, -20);
        this.scene.add(this.lights.rim);

        // 6. Focused spot light on NPC for emphasis (red tint for tension)
        this.lights.npcSpot = new THREE.SpotLight(0xffe5e5, 3.0);
        this.lights.npcSpot.position.set(4, 28, 25);
        this.lights.npcSpot.angle = Math.PI / 7;
        this.lights.npcSpot.penumbra = 0.5; // Soft edges
        this.lights.npcSpot.decay = 2.5;
        this.lights.npcSpot.distance = 70;
        this.lights.npcSpot.castShadow = true;
        this.lights.npcSpot.shadow.mapSize.width = 4096;
        this.lights.npcSpot.shadow.mapSize.height = 4096;
        this.scene.add(this.lights.npcSpot);

        // 7. Additional accent lights for depth
        const accentLight1 = new THREE.PointLight(0xff1744, 0.8, 30);
        accentLight1.position.set(20, 8, -10);
        this.scene.add(accentLight1);
        this.lights.accent1 = accentLight1;

        const accentLight2 = new THREE.PointLight(0x00bcd4, 0.8, 30);
        accentLight2.position.set(-20, 8, -10);
        this.scene.add(accentLight2);
        this.lights.accent2 = accentLight2;

        console.log("[OrgScene4A] Cinematic dark lighting system setup complete");
    }

    setupPostProcessing() {
        console.log("[OrgScene4A] Setting up advanced cinematic post-processing...");

        const renderer = this.experience.renderer.instance;
        const camera = this.experience.camera.perspectiveCamera || this.experience.camera.instance;
        const sizes = this.experience.sizes;

        if (!renderer || !camera) {
            console.warn("[OrgScene4A] Renderer or camera not available for post-processing");
            return;
        }

        // Create effect composer
        this.composer = new EffectComposer(renderer);
        this.composer.setSize(sizes.width, sizes.height);
        this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 1. Render pass - base scene
        const renderPass = new RenderPass(this.scene, camera);
        this.composer.addPass(renderPass);

        // 2. SSAO (Screen Space Ambient Occlusion) for deep realistic shadows
        const ssaoPass = new SSAOPass(this.scene, camera, sizes.width, sizes.height);
        ssaoPass.kernelRadius = 24; // Increased for darker scene
        ssaoPass.minDistance = 0.003;
        ssaoPass.maxDistance = 0.15;
        ssaoPass.output = SSAOPass.OUTPUT.Default;
        this.composer.addPass(ssaoPass);

        // 3. Strong Unreal Bloom for cinematic glow
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(sizes.width, sizes.height),
            1.2,    // Increased strength for dramatic glow
            1.0,    // Larger radius
            0.2     // Lower threshold for more bloom
        );
        this.composer.addPass(bloomPass);

        // 4. Chromatic Aberration for cinematic distortion
        const chromaticAberrationShader = {
            uniforms: {
                'tDiffuse': { value: null },
                'amount': { value: 0.003 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float amount;
                varying vec2 vUv;

                void main() {
                    vec2 offset = amount * (vUv - 0.5);
                    vec4 cr = texture2D(tDiffuse, vUv + offset);
                    vec4 cga = texture2D(tDiffuse, vUv);
                    vec4 cb = texture2D(tDiffuse, vUv - offset);
                    gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);
                }
            `
        };
        const chromaticPass = new ShaderPass(chromaticAberrationShader);
        this.composer.addPass(chromaticPass);

        // 5. Vignette for cinematic framing
        const vignetteShader = {
            uniforms: {
                'tDiffuse': { value: null },
                'darkness': { value: 1.5 }, // Strong vignette
                'offset': { value: 0.95 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float darkness;
                uniform float offset;
                varying vec2 vUv;

                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);
                    vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
                    float vignette = clamp(pow(cos(uv.x * 3.1416), 1.2) * pow(cos(uv.y * 3.1416), 1.2) * darkness, 0.0, 1.0);
                    texel.rgb *= vignette;
                    gl_FragColor = texel;
                }
            `
        };
        const vignettePass = new ShaderPass(vignetteShader);
        this.composer.addPass(vignettePass);

        // 6. Film Grain for cinematic texture
        const filmGrainShader = {
            uniforms: {
                'tDiffuse': { value: null },
                'time': { value: 0.0 },
                'intensity': { value: 0.15 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float time;
                uniform float intensity;
                varying vec2 vUv;

                float random(vec2 co) {
                    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
                }

                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);
                    float noise = random(vUv + time) * intensity;
                    texel.rgb += noise;
                    gl_FragColor = texel;
                }
            `
        };
        this.filmGrainPass = new ShaderPass(filmGrainShader);
        this.composer.addPass(this.filmGrainPass);

        // 7. FXAA (Anti-aliasing) for smooth edges
        const fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.material.uniforms['resolution'].value.x = 1 / (sizes.width * Math.min(window.devicePixelRatio, 2));
        fxaaPass.material.uniforms['resolution'].value.y = 1 / (sizes.height * Math.min(window.devicePixelRatio, 2));
        this.composer.addPass(fxaaPass);

        // 8. Output pass for correct color space
        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);

        console.log("[OrgScene4A] Advanced cinematic post-processing setup complete");

        // Handle resize
        window.addEventListener('resize', () => {
            if (this.composer) {
                this.composer.setSize(sizes.width, sizes.height);
                this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

                // Update FXAA
                if (fxaaPass) {
                    fxaaPass.material.uniforms['resolution'].value.x = 1 / (sizes.width * Math.min(window.devicePixelRatio, 2));
                    fxaaPass.material.uniforms['resolution'].value.y = 1 / (sizes.height * Math.min(window.devicePixelRatio, 2));
                }
            }
        });
    }

    setupAtmosphericEffects() {
        console.log("[OrgScene4A] Setting up dark atmospheric effects...");

        // 1. Add dark cinematic fog for depth and mystery
        this.scene.fog = new THREE.Fog(0x0a0a15, 20, 120); // Very dark blue fog

        // 2. Create dust particle system for atmosphere
        const dustParticleCount = 200;
        const dustGeometry = new THREE.BufferGeometry();
        const dustPositions = new Float32Array(dustParticleCount * 3);
        const dustVelocities = new Float32Array(dustParticleCount * 3);

        for (let i = 0; i < dustParticleCount * 3; i += 3) {
            dustPositions[i] = (Math.random() - 0.5) * 100;      // x
            dustPositions[i + 1] = Math.random() * 40;            // y
            dustPositions[i + 2] = (Math.random() - 0.5) * 100;  // z

            dustVelocities[i] = (Math.random() - 0.5) * 0.02;
            dustVelocities[i + 1] = Math.random() * 0.01 + 0.01;
            dustVelocities[i + 2] = (Math.random() - 0.5) * 0.02;
        }

        dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
        dustGeometry.setAttribute('velocity', new THREE.BufferAttribute(dustVelocities, 3));

        const dustMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.3,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.environmentalEffects.dustParticles = new THREE.Points(dustGeometry, dustMaterial);
        this.scene.add(this.environmentalEffects.dustParticles);
        this.particleSystems.push({
            particles: this.environmentalEffects.dustParticles,
            type: 'dust'
        });

        // 3. Create light rays / god rays effect using geometry
        const rayGeometry = new THREE.BufferGeometry();
        const rayCount = 20;
        const rayPositions = new Float32Array(rayCount * 3);

        for (let i = 0; i < rayCount * 3; i += 3) {
            rayPositions[i] = (Math.random() - 0.5) * 80;
            rayPositions[i + 1] = Math.random() * 30 + 10;
            rayPositions[i + 2] = (Math.random() - 0.5) * 80;
        }

        rayGeometry.setAttribute('position', new THREE.BufferAttribute(rayPositions, 3));

        const rayMaterial = new THREE.PointsMaterial({
            color: 0xffdd88,
            size: 2.0,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.environmentalEffects.lightRays = new THREE.Points(rayGeometry, rayMaterial);
        this.scene.add(this.environmentalEffects.lightRays);

        console.log("[OrgScene4A] Atmospheric effects setup complete");
    }

    enhanceMaterials() {
        console.log("[OrgScene4A] Enhancing materials with PBR...");

        if (!this.ruangGuruModel) {
            console.warn("[OrgScene4A] RuangGuru model not available for material enhancement");
            return;
        }

        // Traverse all meshes and enhance materials
        this.ruangGuruModel.traverse((child) => {
            if (child.isMesh) {
                // Enable shadows
                child.castShadow = true;
                child.receiveShadow = true;

                // Enhance material properties if it's a standard material
                if (child.material) {
                    // If it's a basic material, upgrade to standard for PBR
                    if (child.material.type === 'MeshBasicMaterial') {
                        const oldMaterial = child.material;
                        child.material = new THREE.MeshStandardMaterial({
                            color: oldMaterial.color,
                            map: oldMaterial.map,
                            roughness: 0.7,
                            metalness: 0.1
                        });
                        oldMaterial.dispose();
                    } else if (child.material.type === 'MeshStandardMaterial' || child.material.type === 'MeshPhysicalMaterial') {
                        // Enhance existing standard materials
                        if (!child.material.roughness) child.material.roughness = 0.7;
                        if (!child.material.metalness) child.material.metalness = 0.1;
                        child.material.envMapIntensity = 1.0;
                    }

                    child.material.needsUpdate = true;
                }
            }
        });

        console.log("[OrgScene4A] Materials enhanced with PBR properties");
    }

    updateParticles() {
        if (!this.particleSystems || this.particleSystems.length === 0) return;

        const time = this.experience.time.elapsed * 0.001;

        this.particleSystems.forEach((system) => {
            if (system.type === 'dust' && system.particles) {
                const positions = system.particles.geometry.attributes.position;
                const velocities = system.particles.geometry.attributes.velocity;

                for (let i = 0; i < positions.count; i++) {
                    // Update Y position (floating upward)
                    positions.array[i * 3 + 1] += velocities.array[i * 3 + 1];

                    // Update X and Z positions (drifting)
                    positions.array[i * 3] += velocities.array[i * 3];
                    positions.array[i * 3 + 2] += velocities.array[i * 3 + 2];

                    // Reset particle if it goes too high
                    if (positions.array[i * 3 + 1] > 40) {
                        positions.array[i * 3 + 1] = 0;
                        positions.array[i * 3] = (Math.random() - 0.5) * 100;
                        positions.array[i * 3 + 2] = (Math.random() - 0.5) * 100;
                    }

                    // Wrap particles horizontally
                    if (Math.abs(positions.array[i * 3]) > 50) {
                        positions.array[i * 3] = -positions.array[i * 3];
                    }
                    if (Math.abs(positions.array[i * 3 + 2]) > 50) {
                        positions.array[i * 3 + 2] = -positions.array[i * 3 + 2];
                    }
                }

                positions.needsUpdate = true;
            }
        });

        // Rotate light rays slowly for atmosphere
        if (this.environmentalEffects.lightRays) {
            this.environmentalEffects.lightRays.rotation.y = Math.sin(time * 0.2) * 0.1;
        }
    }

    createSpeechBubbleTooltip() {
        // Create tooltip that appears when hovering over speech bubble
        const tooltip = document.createElement('div');
        tooltip.id = 'speech-bubble-tooltip';
        tooltip.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(10px);
                border: 2px solid rgba(100, 150, 255, 0.5);
                border-radius: 12px;
                padding: 15px 25px;
                color: rgba(255, 255, 255, 0.9);
                font-size: 14px;
                font-family: 'Courier New', monospace;
                z-index: 10000002;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            ">
                ${languageManager.translate(ORG_TEXTS.ui.clickToRead)}
            </div>
        `;
        document.body.appendChild(tooltip);
        this.speechBubbleTooltip = tooltip;
    }

    showScreenSpeechBubble() {
        const screenBubble = document.createElement('div');
        screenBubble.id = 'screen-speech-bubble';
        screenBubble.innerHTML = `
            <div style="
                position: fixed;
                top: 20%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(20px);
                border: 2px solid rgba(100, 150, 255, 0.4);
                border-radius: 20px;
                padding: 35px 40px;
                max-width: 650px;
                box-shadow: 0 12px 48px rgba(0, 0, 0, 0.8), inset 0 0 30px rgba(100, 150, 255, 0.1);
                z-index: 10000001;
                cursor: pointer;
            ">
                <div style="
                    font-size: 22px;
                    font-weight: bold;
                    color: rgba(255, 255, 255, 0.95);
                    margin-bottom: 20px;
                    text-align: center;
                    font-family: 'Courier New', monospace;
                    text-shadow: 0 0 10px rgba(100, 150, 255, 0.5);
                    letter-spacing: 1px;
                ">
                    ${languageManager.translate(ORG_TEXTS.scene4a.speaker)}:
                </div>
                <div style="
                    font-size: 17px;
                    color: rgba(255, 255, 255, 0.9);
                    line-height: 1.8;
                    text-align: center;
                    font-family: 'Gilroy', -apple-system, BlinkMacSystemFont, sans-serif;
                ">
                    ${languageManager.translate(ORG_TEXTS.scene4a.dialogue)}
                </div>
                <div style="
                    text-align: center;
                    margin-top: 25px;
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.5);
                    font-style: italic;
                    font-family: 'Courier New', monospace;
                ">
                    ${languageManager.translate(ORG_TEXTS.ui.clickToClose)}
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
        if (!this.speechBubbleGroup) {
            return;
        }

        // Calculate mouse position in normalized device coordinates
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update raycaster with camera and mouse position
        const activeCamera = this.experience.camera?.perspectiveCamera || this.experience.camera?.instance;
        if (!activeCamera) {
            return;
        }
        this.raycaster.setFromCamera(this.mouse, activeCamera);

        // Check for intersection with speech bubble
        const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);

        if (intersects.length > 0) {
            // Change cursor to pointer
            this.canvas.style.cursor = 'pointer';

            // Add hover effect
            if (this.speechBubbleGroup.scale.x === 1) {
                this.speechBubbleGroup.scale.set(1.05, 1.05, 1.05);
                this.speechBubbleMaterial.color.setHex(0xf0f0f0);
            }
        } else {
            // Reset cursor
            this.canvas.style.cursor = 'default';

            // Remove hover effect
            if (this.speechBubbleGroup.scale.x === 1.05) {
                this.speechBubbleGroup.scale.set(1, 1, 1);
                this.speechBubbleMaterial.color.setHex(0xffffff);
            }
        }
    }

    onMouseClick(event) {
        if (!this.speechBubbleGroup) {
            return;
        }

        // Calculate mouse position
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update raycaster
        const activeCamera = this.experience.camera?.perspectiveCamera || this.experience.camera?.instance;
        if (!activeCamera) {
            return;
        }
        this.raycaster.setFromCamera(this.mouse, activeCamera);

        // Check for intersection
        const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);

        if (intersects.length > 0) {
            console.log("[OrgScene4A] Speech bubble clicked!");

            // Add click animation
            this.speechBubbleGroup.scale.set(0.95, 0.95, 0.95);
            setTimeout(() => {
                this.speechBubbleGroup.scale.set(1.05, 1.05, 1.05);
            }, 100);

            // Play dialogue if available
            if (this.pendingDialogue && !this.hasSpokenDialogue) {
                this.playPendingDialogue();
            }

            // Show screen speech bubble
            this.showScreenSpeechBubble();
        }
    }

    showChoices() {
        console.log("[OrgScene4A] Creating dark cinematic choice panel...");
        
        // Remove existing choice panel if any
        const existingPanel = document.getElementById('choice-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        // Create choice panel element with dark cinematic theme
        const panel = document.createElement('div');
        panel.id = 'choice-panel';
        panel.innerHTML = `
            <div style="
                background: linear-gradient(180deg, rgba(10,10,20,0.95) 0%, rgba(15,15,25,0.98) 100%);
                backdrop-filter: blur(40px) saturate(150%);
                -webkit-backdrop-filter: blur(40px) saturate(150%);
                border: 1px solid rgba(255,255,255,0.05);
                border-radius: 8px;
                padding: 40px;
                max-width: 600px;
                box-shadow:
                    0 20px 60px 0 rgba(0,0,0,0.9),
                    0 0 0 1px rgba(255,255,255,0.02) inset,
                    0 1px 0 rgba(255,255,255,0.05) inset;
                position: relative;
                overflow: hidden;
            ">
                <!-- Scan line effect -->
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(180deg,
                        transparent 0%,
                        rgba(255,255,255,0.015) 50%,
                        transparent 100%
                    );
                    animation: scanline 4s linear infinite;
                    pointer-events: none;
                    z-index: 1;
                "></div>

                <!-- Choice title -->
                <div style="
                    text-align: center;
                    margin-bottom: 30px;
                    position: relative;
                    z-index: 2;
                ">
                    <div style="
                        color: rgba(255,255,255,0.5);
                        font-size: 12px;
                        font-weight: 600;
                        margin-bottom: 12px;
                        letter-spacing: 3px;
                        text-transform: uppercase;
                        font-family: 'Courier New', monospace;
                    ">YOUR DECISION</div>
                    <div style="
                        width: 80px;
                        height: 1px;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                        margin: 0 auto;
                    "></div>
                </div>

                <!-- Choices container -->
                <div style="display: flex; flex-direction: column; gap: 14px; position: relative; z-index: 2;">
                    <!-- Choice A -->
                    <button id="choice-A" style="
                        display: flex;
                        align-items: center;
                        gap: 18px;
                        padding: 18px 22px;
                        background: linear-gradient(135deg, rgba(30,160,120,0.08) 0%, rgba(20,120,90,0.05) 100%);
                        border: 1px solid rgba(60,200,150,0.25);
                        border-radius: 4px;
                        color: white;
                        cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        text-align: left;
                        font-size: 15px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03);
                        position: relative;
                        overflow: hidden;
                        font-family: system-ui, -apple-system, sans-serif;
                    ">
                        <!-- Hover overlay -->
                        <div style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: linear-gradient(135deg, rgba(60,200,150,0.1) 0%, rgba(40,160,120,0.05) 100%);
            opacity: 0;
                            transition: opacity 0.3s ease;
                            pointer-events: none;
                        " class="choice-hover"></div>

                        <span style="
                            font-size: 20px;
                            font-weight: 700;
                            min-width: 32px;
                            height: 32px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: rgba(80,220,160,0.9);
                            background: rgba(60,200,150,0.12);
                            border-radius: 2px;
                            border: 1px solid rgba(60,200,150,0.2);
                            font-family: 'Courier New', monospace;
                            position: relative;
                            z-index: 1;
                        ">A</span>
                        <div style="flex: 1; position: relative; z-index: 1;">
                            <div style="
                                font-weight: 600;
                                font-size: 16px;
                                margin-bottom: 4px;
                                line-height: 1.4;
                                color: rgba(255,255,255,0.95);
                            ">${languageManager.translate(ORG_TEXTS.scene4a.choices.a)}</div>
                        </div>
                    </button>

                    <!-- Choice B -->
                    <button id="choice-B" style="
                        display: flex;
                        align-items: center;
                        gap: 18px;
                        padding: 18px 22px;
                        background: linear-gradient(135deg, rgba(180,30,30,0.08) 0%, rgba(140,20,20,0.05) 100%);
                        border: 1px solid rgba(240,80,80,0.25);
                        border-radius: 4px;
                        color: white;
                        cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        text-align: left;
                        font-size: 15px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03);
                        position: relative;
                        overflow: hidden;
                        font-family: system-ui, -apple-system, sans-serif;
                    ">
                        <!-- Hover overlay -->
                        <div style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: linear-gradient(135deg, rgba(240,80,80,0.1) 0%, rgba(200,60,60,0.05) 100%);
                            opacity: 0;
                            transition: opacity 0.3s ease;
                            pointer-events: none;
                        " class="choice-hover"></div>

                        <span style="
                            font-size: 20px;
                            font-weight: 700;
                            min-width: 32px;
                            height: 32px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: rgba(255,100,100,0.9);
                            background: rgba(240,80,80,0.12);
                            border-radius: 2px;
                            border: 1px solid rgba(240,80,80,0.2);
                            font-family: 'Courier New', monospace;
                            position: relative;
                            z-index: 1;
                        ">B</span>
                        <div style="flex: 1; position: relative; z-index: 1;">
                            <div style="
                                font-weight: 600;
                                font-size: 16px;
                                margin-bottom: 4px;
                                line-height: 1.4;
                                color: rgba(255,255,255,0.95);
                            ">${languageManager.translate(ORG_TEXTS.scene4a.choices.b)}</div>
                        </div>
                    </button>
                </div>
            </div>

            <style>
                @keyframes scanline {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }

                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(40px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                #choice-A:hover .choice-hover,
                #choice-B:hover .choice-hover {
                    opacity: 1;
                }

                #choice-A:hover {
                    transform: translateX(4px);
                    border-color: rgba(80,220,160,0.5);
                    box-shadow: 0 4px 16px rgba(60,200,150,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
                }

                #choice-B:hover {
                    transform: translateX(4px);
                    border-color: rgba(255,120,120,0.5);
                    box-shadow: 0 4px 16px rgba(240,80,80,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
                }
            </style>
        `;

        panel.style.cssText = `
            position: fixed;
            bottom: 20%;
            left: 50%;
            transform: translate(-50%, 0);
            z-index: 10000000;
            opacity: 0;
            transition: opacity 0.5s ease;
            animation: slideInUp 0.5s ease forwards;
        `;

        document.body.appendChild(panel);

        setTimeout(() => {
            panel.style.opacity = '1';
        }, 100);

        document.getElementById('choice-A').addEventListener('click', () => {
            console.log("[OrgScene4A] Player chose A");
            // Play click sound
            if (this.experience && this.experience.soundManager) {
                this.experience.soundManager.play('click', 0.6);
            }
            this.handleChoice('A');
        });

        document.getElementById('choice-B').addEventListener('click', () => {
            console.log("[OrgScene4A] Player chose B");
            // Play click sound
            if (this.experience && this.experience.soundManager) {
                this.experience.soundManager.play('click', 0.6);
            }
            this.handleChoice('B');
        });

        this.choicePanel = panel;
    }

    handleChoice(choiceId) {
        console.log(`[OrgScene4A] Player chose: ${choiceId}`);

        let scoreIncrease = 0;

        if (choiceId === 'A') {
            // Pilihan A: Memberikan laporan transparan
            scoreIncrease = 0;
        } else if (choiceId === 'B') {
            // Pilihan B: Manipulasi laporan dana
            scoreIncrease = 25;
        }

        // Update corruption score via ScoreManager and show at ending
        if (this.experience && this.experience.scoreManager) {
            this.experience.scoreManager.addScore(scoreIncrease);
            console.log(`[OrgScene4A] ScoreManager total score: ${this.experience.scoreManager.getScore()}%`);
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
                    💭 ${languageManager.translate(ORG_TEXTS.ui.supplementTitle)}
                </div>
                <div style="font-size: 18px; color: #fff; line-height: 1.6; font-style: italic;">
                    "${languageManager.translate(ORG_TEXTS.scene4a.supplementMessage)}"
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
                console.log("[OrgScene4A] Showing ending...");
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
            console.log("[OrgScene4A] Ending displayed");
        }).catch((error) => {
            console.error("[OrgScene4A] Error showing ending:", error);
        });
    }

    update() {
        if (this.westgatePortal) {
            this.westgatePortal.update();
        }

        if (this.npcMixer) {
            this.npcMixer.update(this.experience.time.delta * 0.001);
        }

        // Keep speech bubble floating above the NPC if both exist
        if (this.npcPembina && this.speechBubbleGroup) {
            const npcPos = this.npcPembina.position;
            this.speechBubbleGroup.position.set(npcPos.x, npcPos.y + 18, npcPos.z);
        }

        // Update particle systems for atmospheric effects
        this.updateParticles();

        this.checkPlayerProximity();

        if (this.uiManager) {
            this.uiManager.updatePositions();
        }

        // Update film grain time for animation
        if (this.filmGrainPass && this.filmGrainPass.uniforms) {
            this.filmGrainPass.uniforms.time.value = this.experience.time.elapsed * 0.001;
        }

        // Render using composer for post-processing effects
        if (this.composer) {
            this.composer.render();
        }
    }

    dispose() {
        console.log("[OrganizationScene4A] Disposing...");

        // Dispose professional rendering features
        if (this.composer) {
            this.composer.dispose();
            this.composer = null;
        }

        // Dispose all lights
        if (this.lights) {
            Object.values(this.lights).forEach(light => {
                if (light && light.dispose) {
                    this.scene.remove(light);
                    light.dispose();
                }
            });
            this.lights = {};
        }

        // Dispose particle systems
        if (this.particleSystems) {
            this.particleSystems.forEach(system => {
                if (system.particles) {
                    if (system.particles.geometry) {
                        system.particles.geometry.dispose();
                    }
                    if (system.particles.material) {
                        system.particles.material.dispose();
                    }
                    this.scene.remove(system.particles);
                }
            });
            this.particleSystems = [];
        }

        // Dispose environmental effects
        if (this.environmentalEffects) {
            if (this.environmentalEffects.dustParticles) {
                if (this.environmentalEffects.dustParticles.geometry) {
                    this.environmentalEffects.dustParticles.geometry.dispose();
                }
                if (this.environmentalEffects.dustParticles.material) {
                    this.environmentalEffects.dustParticles.material.dispose();
                }
                this.scene.remove(this.environmentalEffects.dustParticles);
            }
            if (this.environmentalEffects.lightRays) {
                if (this.environmentalEffects.lightRays.geometry) {
                    this.environmentalEffects.lightRays.geometry.dispose();
                }
                if (this.environmentalEffects.lightRays.material) {
                    this.environmentalEffects.lightRays.material.dispose();
                }
                this.scene.remove(this.environmentalEffects.lightRays);
            }
            this.environmentalEffects = {};
        }

        // Remove fog
        if (this.scene.fog) {
            this.scene.fog = null;
        }

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

        if (this.speechBubbleTooltip) {
            if (document.body.contains(this.speechBubbleTooltip)) {
                document.body.removeChild(this.speechBubbleTooltip);
            }
            this.speechBubbleTooltip = null;
        }

        if (this.choicePanel) {
            this.choicePanel.remove();
            this.choicePanel = null;
        }

        if (this.speechBubbleGroup) {
            this.scene.remove(this.speechBubbleGroup);
            this.speechBubbleGroup = null;
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
            SceneLoadingIndicator.hide();
        }

        // Clean up model from scene
        if (this.ruangGuruModel && this.ruangGuruModel.parent) {
            this.scene.remove(this.ruangGuruModel.parent);
        }
    }
}
