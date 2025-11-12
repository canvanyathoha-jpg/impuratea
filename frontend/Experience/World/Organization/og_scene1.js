
import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import Portal from "../Portal.js";
import UIManager from "../../Utils/UIManager.js";
import OpeningStory, { SCENE_DATA } from "../../Utils/OpeningStory.js";
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

        // Stop any existing AI Voice from previous scenes
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        // Initialize AI Voice for this scene
        this.aiVoice = new AIVoice();

        // Track AI voice timeout to clear on dispose
        this.aiVoiceTimeout = null;
        // Keep references to resource loading callbacks so we can detach them later.
        this.resourceLoadingHandler = null;
        this.resourceReadyHandler = null;
        // Track whether we already executed the heavy world setup callback to avoid duplicate calls.
        this.worldSetupResolved = false;
        // Track AI voice dialogue state
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

        // Debug: Check if player exists
        console.log("[OrgScene1] Constructor - Player exists:", !!this.experience.world.player);
        if (this.experience.world.player) {
            console.log("[OrgScene1] Constructor - Player avatar exists:", !!this.experience.world.player.avatar);
        }

        // Add event listeners for speech bubble interaction
        this.canvas = this.experience.canvas;
        this.onMouseClick = this.onMouseClick.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.canvas.addEventListener('click', this.onMouseClick);
        this.canvas.addEventListener('mousemove', this.onMouseMove);
        // Add touch support for mobile
        this.canvas.addEventListener('touchend', this.onTouchEnd, { passive: false });
        this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
        
        // Show opening story first
        this.initWithOpening();
    }

    initWithOpening() {
        console.log("[OrgScene1] Loading scene in background first...");

        // Show modern loading indicator
        this.loadingIndicator = SceneLoadingIndicator.show();
        // Hook resource loading events so the indicator reflects real progress and never finishes too early.
        this.attachResourceLoadingEvents();

        // CRITICAL: Wait for resources to be ready first!
        const waitForResources = () => {
            if (this.resources.isReady) {
                console.log("[OrgScene1] ✅ Resources ready, starting scene load...");
                // Resources ready, proceed with scene loading
                this.loadSceneAsync().then(() => {
                    console.log("[OrgScene1] ✅ Scene loaded successfully!");

                    // Hide loading indicator
                    SceneLoadingIndicator.hide();

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
                    SceneLoadingIndicator.hide();
                });
            } else {
                // Resources not ready yet, wait for 'ready' event
                console.log("[OrgScene1] ⏳ Waiting for resources to be ready...");
                this.resources.once('ready', () => {
                    console.log("[OrgScene1] ✅ Resources ready event fired!");
                    waitForResources();
                });
            }
        };

        // Start waiting for resources
        waitForResources();
    }

    attachResourceLoadingEvents() {
        // Avoid registering listeners if resources are missing for some reason.
        if (!this.resources || typeof this.resources.on !== 'function') {
            console.warn("[OrgScene1] Resources not available, cannot attach loading events.");
            return;
        }

        // If assets already loaded we simply push the progress bar to 100% and exit early.
        if (this.resources.isReady) {
            this.updateLoadingProgress(100);
            return;
        }

        // Memoise the handlers so we can remove them during dispose().
        if (!this.resourceLoadingHandler) {
            this.resourceLoadingHandler = (loaded, total) => {
                // Guard against division by zero and cap progress at 95% so the bar stays visible until cleanup finishes.
                const cappedTotal = total || 1;
                const percentage = Math.round((loaded / cappedTotal) * 100);
                this.updateLoadingProgress(Math.min(percentage, 95));
            };
        }

        if (!this.resourceReadyHandler) {
            this.resourceReadyHandler = () => {
                this.updateLoadingProgress(100);
                if (typeof this.resources.removeListener === 'function' && this.resourceLoadingHandler) {
                    this.resources.removeListener('loading', this.resourceLoadingHandler);
                }
                this.resourceLoadingHandler = null;
                this.resourceReadyHandler = null;
            };
        }

        // Ensure we never double-register handlers when the scene is constructed multiple times.
        if (typeof this.resources.removeListener === 'function') {
            this.resources.removeListener('loading', this.resourceLoadingHandler);
            this.resources.removeListener('ready', this.resourceReadyHandler);
        }

        this.resources.on('loading', this.resourceLoadingHandler);
        this.resources.once('ready', this.resourceReadyHandler);
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
        this.loadingIndicator.style.pointerEvents = 'none';
        this.loadingIndicator.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%);
                z-index: 10000001;
                display: flex;
                justify-content: center;
                align-items: center;
                pointer-events: none;
                opacity: 0;
                animation: fadeIn 0.3s ease forwards;
            ">
                <div style="
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 35px;
                    padding: 50px 70px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 30px;
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 60px rgba(255, 255, 255, 0.02);
                ">
                    <!-- Spinning Logo -->
                    <div style="
                        width: 80px;
                        height: 80px;
                        background: linear-gradient(135deg, rgba(139, 0, 0, 0.3), rgba(30, 64, 124, 0.3));
                        border-radius: 50%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        box-shadow:
                            0 0 30px rgba(139, 0, 0, 0.4),
                            0 0 60px rgba(30, 64, 124, 0.3),
                            inset 0 0 20px rgba(255, 255, 255, 0.1);
                        animation: pulse 2s ease-in-out infinite;
                    ">
                        <div style="
                            width: 40px;
                            height: 40px;
                            border: 3px solid transparent;
                            border-top-color: rgba(255, 255, 255, 0.9);
                            border-right-color: rgba(139, 0, 0, 0.7);
                            border-radius: 50%;
                            animation: spin 1.2s linear infinite;
                        "></div>
                    </div>

                    <!-- Loading Text -->
                    <div style="
                        color: rgba(255, 255, 255, 0.95);
                        font-size: 26px;
                        font-weight: 300;
                        font-family: 'Gilroy', -apple-system, BlinkMacSystemFont, sans-serif;
                        letter-spacing: 4px;
                        text-transform: uppercase;
                        text-shadow:
                            0 0 20px rgba(139, 0, 0, 0.6),
                            0 0 40px rgba(30, 64, 124, 0.4),
                            0 4px 20px rgba(0, 0, 0, 0.5);
                        animation: textGlow 2s ease-in-out infinite;
                    ">
                        Memuat Scene
                    </div>

                    <!-- Progress Bar -->
                    <div style="
                        width: 320px;
                        height: 4px;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
                    ">
                        <div id="loading-progress-bar" style="
                            width: 100%;
                            height: 100%;
                            background: linear-gradient(90deg,
                                rgba(139, 0, 0, 0.8) 0%,
                                rgba(30, 64, 124, 0.8) 50%,
                                rgba(255, 215, 0, 0.8) 100%
                            );
                            border-radius: 10px;
                            animation: progressSlide 1.5s ease-in-out infinite;
                            box-shadow: 0 0 15px rgba(139, 0, 0, 0.6);
                        "></div>
                    </div>

                    <!-- Subtitle -->
                    <div style="
                        color: rgba(255, 255, 255, 0.5);
                        font-size: 13px;
                        font-weight: 400;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                        font-family: 'Gilroy', sans-serif;
                        animation: fadeInOut 2s ease-in-out infinite;
                    ">
                        Mohon tunggu sebentar...
                    </div>
                </div>

                <!-- Background Orbs -->
                <div style="
                    position: absolute;
                    top: -20%;
                    right: -10%;
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, rgba(139, 0, 0, 0.15) 0%, transparent 70%);
                    border-radius: 50%;
                    filter: blur(60px);
                    animation: floatOrb 8s ease-in-out infinite;
                "></div>
                <div style="
                    position: absolute;
                    bottom: -20%;
                    left: -10%;
                    width: 350px;
                    height: 350px;
                    background: radial-gradient(circle, rgba(30, 64, 124, 0.15) 0%, transparent 70%);
                    border-radius: 50%;
                    filter: blur(60px);
                    animation: floatOrb 10s ease-in-out infinite reverse;
                "></div>
            </div>
        `;

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes pulse {
                0%, 100% {
                    transform: scale(1);
                    box-shadow:
                        0 0 30px rgba(139, 0, 0, 0.4),
                        0 0 60px rgba(30, 64, 124, 0.3),
                        inset 0 0 20px rgba(255, 255, 255, 0.1);
                }
                50% {
                    transform: scale(1.05);
                    box-shadow:
                        0 0 40px rgba(139, 0, 0, 0.6),
                        0 0 80px rgba(30, 64, 124, 0.5),
                        inset 0 0 30px rgba(255, 255, 255, 0.15);
                }
            }
            @keyframes textGlow {
                0%, 100% {
                    opacity: 0.9;
                    text-shadow:
                        0 0 20px rgba(139, 0, 0, 0.6),
                        0 0 40px rgba(30, 64, 124, 0.4),
                        0 4px 20px rgba(0, 0, 0, 0.5);
                }
                50% {
                    opacity: 1;
                    text-shadow:
                        0 0 30px rgba(139, 0, 0, 0.8),
                        0 0 60px rgba(30, 64, 124, 0.6),
                        0 4px 20px rgba(0, 0, 0, 0.5);
                }
            }
            @keyframes progressSlide {
                0% {
                    transform: translateX(-100%);
                }
                100% {
                    transform: translateX(100%);
                }
            }
            @keyframes fadeInOut {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.7; }
            }
            @keyframes floatOrb {
                0%, 100% {
                    transform: translate(0, 0) scale(1);
                    opacity: 0.3;
                }
                50% {
                    transform: translate(-50px, -50px) scale(1.1);
                    opacity: 0.5;
                }
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
            // Disable the infinite animation so the bar reflects the numeric progress we set below.
            progressBar.style.animation = 'none';
            progressBar.style.width = `${progress}%`;
        }
    }

    async loadSceneAsync() {
        console.log("[OrgScene1] 🚀 loadSceneAsync() started");
        return new Promise((resolve, reject) => {
            try {
                // Step 1: Load basic scene structure (non-blocking)
                console.log("[OrgScene1] Step 1: Setting up world...");
                this.updateLoadingProgress(20);
                this.setWorldAsync(() => {
                    console.log("[OrgScene1] ✅ setWorldAsync callback fired!");
                    this.updateLoadingProgress(40);

                    // Step 2: Setup professional lighting
                    console.log("[OrgScene1] Step 2: Setting up professional lighting...");
                    this.setupProfessionalLighting();
                    this.updateLoadingProgress(50);

                    // Step 3: Enhance materials with PBR
                    console.log("[OrgScene1] Step 3: Enhancing materials...");
                    this.enhanceMaterials();
                    this.updateLoadingProgress(60);

                    // Step 4: Setup atmospheric effects
                    console.log("[OrgScene1] Step 4: Setting up atmospheric effects...");
                    this.setupAtmosphericEffects();
                    this.updateLoadingProgress(70);

                    // Step 5: Setup post-processing
                    console.log("[OrgScene1] Step 5: Setting up post-processing...");
                    this.setupPostProcessing();
                    this.updateLoadingProgress(75);

                    // Step 6: Create portals (lightweight)
                    console.log("[OrgScene1] Step 6: Creating portals...");
                    this.createPortals();
                    this.updateLoadingProgress(80);

                    // Step 7: Create NPC (lightweight)
                    console.log("[OrgScene1] Step 7: Creating NPC...");
                    this.createNPC();
                    this.updateLoadingProgress(90);

                    // Step 8: Ensure player is spawned correctly
                    console.log("[OrgScene1] Step 8: Ensuring player spawned...");
                    this.ensurePlayerSpawned();
                    this.updateLoadingProgress(95);

                    // Step 9: Create cinematic intro
                    console.log("[OrgScene1] Step 9: Creating cinematic intro...");
                    this.createIntroAnimation();

                    // Step 10: Finalize
                    this.updateLoadingProgress(100);
                    console.log("[OrgScene1] 🎉 All professional features loaded successfully!");

                    // Resolve immediately - no delay needed
                    resolve();
                });
            } catch (error) {
                console.error("[OrgScene1] ❌ Error in loadSceneAsync:", error);
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
                const spawnPoint = this.experience.world.spawnPoints?.og_scene1 || new THREE.Vector3(0, 0, 10);
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

            // NOTE:
            // Resolve the world setup callback right away so the rest of the scene keeps loading
            // while the octree is still being prepared in the background.
            this.resolveWorldSetupCallback(callback);

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
                        } catch (error) {
                            console.error("[OrgScene1] Error building octree:", error);
                        }
                    }, 100); // Small delay
                });
            }, 100); // Initial delay
        });
    }

    resolveWorldSetupCallback(callback) {
        // Guard against multiple executions: we only want to resolve once.
        if (this.worldSetupResolved) {
            return;
        }
        this.worldSetupResolved = true;

        if (callback) {
            console.log("[OrgScene1] World setup callback resolved, continuing scene initialization...");
            callback();
        }
    }

    setupProfessionalLighting() {
        console.log("[OrgScene1] Setting up cinematic dark lighting system...");

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

        console.log("[OrgScene1] Cinematic dark lighting system setup complete");
    }

    setupPostProcessing() {
        console.log("[OrgScene1] Setting up advanced cinematic post-processing...");

        const renderer = this.experience.renderer.instance;
        const camera = this.experience.camera.perspectiveCamera || this.experience.camera.instance;
        const sizes = this.experience.sizes;

        if (!renderer || !camera) {
            console.warn("[OrgScene1] Renderer or camera not available for post-processing");
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

        console.log("[OrgScene1] Advanced cinematic post-processing setup complete");

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
        console.log("[OrgScene1] Setting up dark atmospheric effects...");

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

        console.log("[OrgScene1] Atmospheric effects setup complete");
    }

    enhanceMaterials() {
        console.log("[OrgScene1] Enhancing materials with PBR...");

        if (!this.organizationModel) {
            console.warn("[OrgScene1] Organization model not available for material enhancement");
            return;
        }

        // Traverse all meshes and enhance materials
        this.organizationModel.traverse((child) => {
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

        console.log("[OrgScene1] Materials enhanced with PBR properties");
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
        const maleModel = this.resources.items.npc;
        console.log("[OrgScene1] Male model found:", !!maleModel);
        if (!maleModel) {
            console.error("[OrgScene1] Male avatar model not found!");
            console.log("[OrgScene1] Available resources:", Object.keys(this.resources.items));
            return;
        }

        // Clone the male avatar model using SkeletonUtils for proper skeleton handling
        this.npcSenior = SkeletonUtils.clone(maleModel.scene);

        // Ensure the cloned model is fully visible
        this.npcSenior.visible = true;
        this.npcSenior.traverse((child) => {
            if (child.isMesh) {
                child.visible = true;
                // OPTIMIZATION: Disable shadows for better performance
                child.castShadow = false;
                child.receiveShadow = false;
            }
        });
        this.npcSenior.position.set(4, 1, 27); // Y=1 to lower NPC position significantly, Z increased to move NPC backward
        this.npcSenior.rotation.y = Math.PI; // Menghadap player
        // Scale 9x makes NPC same size as player - equal proportions
        this.npcSenior.scale.set(9, 9, 9);
        // OPTIMIZATION: Enable frustum culling for better performance
        this.npcSenior.frustumCulled = true;
        console.log("[OrgScene1] Adding NPC to scene...");
        this.scene.add(this.npcSenior);
        console.log("[OrgScene1] NPC added to scene successfully");
        console.log("[OrgScene1] NPC Position:", this.npcSenior.position);
        console.log("[OrgScene1] NPC Visible:", this.npcSenior.visible);

        // Clone animations for proper animation handling
        this.npcAnimations = maleModel.animations.map((clip) => clip.clone());

        if (!this.npcAnimations.length) {
            console.warn("[OrgScene1] Male model does not contain animation clips. Senior NPC will stay static.");
        } else {
            const availableNames = this.npcAnimations.map((clip) => clip.name || "(unnamed)");
            console.log("[OrgScene1] Available male animations:", availableNames);

            const findClip = (keywords) => {
                return this.npcAnimations.find((clip) => {
                    const lower = (clip.name || "").toLowerCase();
                    return keywords.some((keyword) => lower.includes(keyword));
                });
            };

            const fallbackClip = this.npcAnimations[0];
            const ensureClip = (label, keywords) => {
                const clip = findClip(keywords);
                if (clip) {
                    return clip;
                }
                console.warn(`[OrgScene1] Animation for "${label}" not found. Using fallback "${fallbackClip.name}".`);
                return fallbackClip;
            };

            // Setup animation mixer dan daftar aksi hanya memakai clip valid.
            this.npcMixer = new THREE.AnimationMixer(this.npcSenior);
            this.npcActions = {};
            const idleClip = ensureClip("idle", ["idle", "stand", "pose"]);
            this.npcActions.idle = this.npcMixer.clipAction(idleClip);

            const wavingClip = findClip(["wave", "greet"]);
            if (wavingClip) {
                this.npcActions.waving = this.npcMixer.clipAction(wavingClip);
            }

            // Start with idle animation
            this.npcCurrentAction = this.npcActions.idle;
            this.npcCurrentAction.play();
        }

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

        // Cinematic camera focus on NPC
        this.cinematicNPCFocus();

        // Create speech bubble
        console.log("[OrgScene1] Creating speech bubble...");
        this.createSimpleSpeechBubble();

        // Show choice panel after delay (6 seconds to see speech bubble)
        setTimeout(() => {
            console.log("[OrgScene1] Showing choices after 6 seconds...");
            this.showChoices();
        }, 6000); // Delay 6 detik untuk memberi waktu player melihat speech bubble dulu
    }

    cinematicNPCFocus() {
        console.log("[OrgScene1] Starting cinematic NPC focus...");

        // Dramatic camera focus with subtle zoom
        const camera = this.experience.camera.perspectiveCamera || this.experience.camera.instance;
        if (!camera) return;

        // Store original FOV
        if (!this.originalFOV) {
            this.originalFOV = camera.fov;
        }

        // Smooth FOV zoom in (cinematic)
        let targetFOV = this.originalFOV - 10;
        const fovStep = (camera.fov - targetFOV) / 60; // 60 frames

        let frameCount = 0;
        const zoomInterval = setInterval(() => {
            if (frameCount < 60 && camera.fov > targetFOV) {
                camera.fov -= fovStep;
                camera.updateProjectionMatrix();
                frameCount++;
            } else {
                clearInterval(zoomInterval);
            }
        }, 16);
    }

    playPendingDialogue() {
        if (!this.aiVoice || !this.pendingDialogue || this.hasSpokenDialogue) {
            return;
        }
        this.aiVoice.speak(this.pendingDialogue);
        this.hasSpokenDialogue = true;
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

        // Clear any existing timeout first
        if (this.aiVoiceTimeout) {
            clearTimeout(this.aiVoiceTimeout);
        }

        const dialogue = languageManager.translate(ORG_TEXTS.scene1.dialogue);
        this.pendingDialogue = dialogue;
        this.hasSpokenDialogue = false;

        const userCanAutoPlay = !!(navigator.userActivation && (navigator.userActivation.isActive || navigator.userActivation.hasBeenActive));

        // Speak the dialogue with AI voice after a delay
        if (userCanAutoPlay) {
            this.aiVoiceTimeout = setTimeout(() => {
                this.playPendingDialogue();
            }, 1000); // 1 second delay after speech bubble appears
        } else {
            console.warn("[OrgScene1] Skipping auto speech (browser requires user interaction). Click the bubble or alternative button to play audio.");
        }
    }

    create3DSpeechBubble() {
        console.log("[OrgScene1] Creating 3D speech bubble...");

        // Create a group for the speech bubble
        this.speechBubbleGroup = new THREE.Group();

        // Create speech bubble background with dark theme
        const geometry = new THREE.PlaneGeometry(8, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0x1a1a2e,
            transparent: true,
            opacity: 0.95,
            side: THREE.FrontSide,
            depthWrite: false
        });
        this.speechBubblePlane = new THREE.Mesh(geometry, material);

        // Store material reference for hover effects
        this.speechBubbleMaterial = material;

        // Create speech bubble border with accent color
        const borderGeometry = new THREE.PlaneGeometry(8.2, 4.2);
        const borderMaterial = new THREE.MeshBasicMaterial({
            color: 0x4a90e2,
            transparent: true,
            opacity: 0.6,
            side: THREE.FrontSide,
            depthWrite: false
        });
        this.speechBubbleBorder = new THREE.Mesh(borderGeometry, borderMaterial);

        // Create speech bubble tail
        const tailGeometry = new THREE.ConeGeometry(0.4, 1.2, 6);
        const tailMaterial = new THREE.MeshBasicMaterial({
            color: 0x1a1a2e,
            transparent: true,
            opacity: 0.95,
            depthWrite: false
        });
        this.speechBubbleArrow = new THREE.Mesh(tailGeometry, tailMaterial);
        this.speechBubbleArrow.rotation.x = Math.PI;
        this.speechBubbleArrow.position.set(-2.5, -2.5, 0);

        // Add all elements to group
        this.speechBubbleGroup.add(this.speechBubbleBorder);
        this.speechBubbleGroup.add(this.speechBubblePlane);
        this.speechBubbleGroup.add(this.speechBubbleArrow);

        // Create text texture for the speech bubble
        this.createSpeechTextTexture();

        // Position bubble above the NPC
        if (this.npcSenior) {
            const npcPos = this.npcSenior.position.clone();
            npcPos.y += 18; // Reduced from 24 to lower bubble chat position
            npcPos.z += 3; // Move bubble chat backward (away from player)
            this.speechBubbleGroup.position.copy(npcPos);
        } else {
            this.speechBubbleGroup.position.set(4, 19, 30); // Reduced Y from 24 to 19, Z remains to move backward
        }

        // Rotate speech bubble 180 degrees
        this.speechBubbleGroup.rotation.y = Math.PI;

        // Add to scene
        this.scene.add(this.speechBubbleGroup);

        // Add tooltip for speech bubble interaction
        this.createSpeechBubbleTooltip();

        console.log("[OrgScene1] 3D speech bubble created and positioned above NPC");
    }

    createSpeechTextTexture() {
        console.log("[OrgScene1] Creating speech text texture...");

        // Create canvas for text
        const canvas = document.createElement('canvas');
        canvas.width = 1500;
        canvas.height = 750;
        const context = canvas.getContext('2d');

        // Enable anti-aliasing
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        // Set dark background
        context.fillStyle = 'rgba(26, 26, 46, 1.0)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Add shadow for text visibility
        context.shadowColor = 'rgba(0, 0, 0, 0.8)';
        context.shadowBlur = 5;
        context.shadowOffsetX = 3;
        context.shadowOffsetY = 3;

        // Set text properties
        context.fillStyle = '#ffffff';
        context.strokeStyle = '#4a90e2';
        context.lineWidth = 2;
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // Draw title
        const speakerName = languageManager.translate(ORG_TEXTS.scene1.speaker) + ':';
        context.strokeText(speakerName, canvas.width / 2, 120);
        context.fillText(speakerName, canvas.width / 2, 120);

        // Set dialogue font
        context.font = 'bold 36px Arial';

        // Draw dialogue text
        const dialogue = languageManager.getLanguage() === 'id' ?
            "Dengar, dana acara kita mepet.\nSaya butuh kamu serahkan sebagian uang kas\n yang kamu pegang untuk 'dana taktis'.\n\nNanti laporannya gampang,\n kita manipulasi saja agar semuanya terlihat pas." :
            "Listen, our event funds are tight.\nI need you to hand over part of the cash\nyou're holding for tactical funds.\n\nThe report will be easy,\nwe'll just manipulate it so everything looks right.";

        const lines = dialogue.split('\n');
        let y = 180;
        lines.forEach(line => {
            context.strokeText(line, canvas.width / 2, y);
            context.fillText(line, canvas.width / 2, y);
            y += 50;
        });

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // Create material with text texture
        const textMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 1.0,
            side: THREE.FrontSide,
            depthWrite: false
        });

        // Create text plane
        const textGeometry = new THREE.PlaneGeometry(7.8, 3.8);
        this.speechTextPlane = new THREE.Mesh(textGeometry, textMaterial);
        this.speechTextPlane.position.z = 0.01;

        // Add text plane to speech bubble group
        this.speechBubbleGroup.add(this.speechTextPlane);

        console.log("[OrgScene1] Speech text texture created and added to bubble");
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
                this.speechBubbleMaterial.color.setHex(0x2a2a3e);
            }
        } else {
            // Reset cursor
            this.canvas.style.cursor = 'default';

            // Remove hover effect
            if (this.speechBubbleGroup.scale.x === 1.05) {
                this.speechBubbleGroup.scale.set(1, 1, 1);
                this.speechBubbleMaterial.color.setHex(0x1a1a2e);
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
            console.log("[OrgScene1] Speech bubble clicked!");

            // Add click animation
            this.speechBubbleGroup.scale.set(0.95, 0.95, 0.95);
            setTimeout(() => {
                this.speechBubbleGroup.scale.set(1.05, 1.05, 1.05);
            }, 100);

            this.playPendingDialogue();
            this.showScreenSpeechBubble();
        }
    }

    onTouchEnd(event) {
        if (!this.speechBubbleGroup) {
            return;
        }

        // Get touch position
        const touch = event.changedTouches[0];
        if (!touch) return;

        // Calculate touch position in normalized device coordinates
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

        // Update raycaster
        const activeCamera = this.experience.camera?.perspectiveCamera || this.experience.camera?.instance;
        if (!activeCamera) {
            return;
        }
        this.raycaster.setFromCamera(this.mouse, activeCamera);

        // Check for intersection
        const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);

        if (intersects.length > 0) {
            console.log("[OrgScene1] Speech bubble touched!");

            // Prevent default and stop propagation to avoid triggering camera controls
            event.preventDefault();
            event.stopPropagation();

            // Add click animation
            this.speechBubbleGroup.scale.set(0.95, 0.95, 0.95);
            setTimeout(() => {
                this.speechBubbleGroup.scale.set(1.05, 1.05, 1.05);
            }, 100);

            this.playPendingDialogue();
            this.showScreenSpeechBubble();
        }
    }

    onTouchMove(event) {
        if (!this.speechBubbleGroup) {
            return;
        }

        // Get touch position
        const touch = event.touches[0];
        if (!touch) return;

        // Calculate touch position in normalized device coordinates
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

        // Update raycaster
        const activeCamera = this.experience.camera?.perspectiveCamera || this.experience.camera?.instance;
        if (!activeCamera) {
            return;
        }
        this.raycaster.setFromCamera(this.mouse, activeCamera);

        // Check for intersection with speech bubble
        const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);

        if (intersects.length > 0) {
            // Prevent default to avoid triggering camera controls when hovering over bubble
            event.preventDefault();
            
            // Change cursor to pointer (visual feedback)
            this.canvas.style.cursor = 'pointer';

            // Add hover effect
            if (this.speechBubbleGroup.scale.x === 1) {
                this.speechBubbleGroup.scale.set(1.05, 1.05, 1.05);
                this.speechBubbleMaterial.color.setHex(0x2a2a3e);
            }
        } else {
            // Reset cursor
            this.canvas.style.cursor = 'default';

            // Remove hover effect
            if (this.speechBubbleGroup.scale.x === 1.05) {
                this.speechBubbleGroup.scale.set(1, 1, 1);
                this.speechBubbleMaterial.color.setHex(0x1a1a2e);
            }
        }
    }


    createSpeechBubbleTooltip() {
        console.log("[OrgScene1] Creating speech bubble tooltip...");

        // Create tooltip with dark theme
        const tooltip = document.createElement('div');
        tooltip.id = 'speech-bubble-tooltip';
        tooltip.innerHTML = `
            <div style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(10,10,20,0.95); backdrop-filter: blur(10px); color: rgba(255,255,255,0.9); padding: 12px 24px; border-radius: 4px; border: 1px solid rgba(74,144,226,0.3); font-size: 13px; z-index: 10000002; pointer-events: none; opacity: 0; transition: opacity 0.3s ease; font-family: 'Courier New', monospace;">
                <div style="text-align: center;">
                    <div style="font-weight: bold; margin-bottom: 5px;">💬 Click speech bubble to read</div>
                    <div style="font-size: 11px; opacity: 0.7;">Use cursor to interact</div>
                </div>
            </div>
        `;

        document.body.appendChild(tooltip);

        // Show tooltip after delay
        setTimeout(() => {
            const tooltipDiv = tooltip.querySelector('div');
            tooltipDiv.style.opacity = '1';
        }, 2000);

        // Hide tooltip after showing
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

        // Create screen overlay speech bubble with dark theme
        const screenBubble = document.createElement('div');
        screenBubble.id = 'screen-speech-bubble';
        screenBubble.innerHTML = `
            <div style="position: fixed; top: 20%; left: 50%; transform: translateX(-50%); background: linear-gradient(180deg, rgba(10,10,20,0.98) 0%, rgba(15,15,25,0.98) 100%); backdrop-filter: blur(40px); border: 1px solid rgba(74,144,226,0.3); border-radius: 8px; padding: 30px 40px; max-width: 600px; box-shadow: 0 20px 60px rgba(0,0,0,0.9); z-index: 10000001; cursor: pointer;">
                <div style="font-size: 20px; font-weight: bold; color: rgba(74,144,226,0.9); margin-bottom: 20px; text-align: center; font-family: 'Courier New', monospace; letter-spacing: 2px; text-transform: uppercase;">
                    ${languageManager.translate(ORG_TEXTS.scene1.speaker)}
                </div>
                <div style="font-size: 16px; color: rgba(255,255,255,0.9); line-height: 1.8; text-align: left; font-family: system-ui, sans-serif;">
                    ${languageManager.translate(ORG_TEXTS.scene1.dialogue).replace(/\n/g, '<br>')}
                </div>
                <div style="text-align: center; margin-top: 25px; font-size: 12px; color: rgba(255,255,255,0.5); font-family: 'Courier New', monospace; letter-spacing: 1px;">
                    ${languageManager.translate(ORG_TEXTS.ui.clickToClose)}
                </div>
            </div>
        `;

        document.body.appendChild(screenBubble);
        this.playPendingDialogue();

        // Add click event to close
        screenBubble.addEventListener('click', () => {
            if (this.experience && this.experience.soundManager) {
                this.experience.soundManager.play('click', 0.6);
            }
            document.body.removeChild(screenBubble);
            console.log("[OrgScene1] Screen speech bubble closed");
        });

        console.log("[OrgScene1] Screen speech bubble displayed");
    }

    showChoices() {
        console.log("[OrgScene1] Creating dark cinematic choice panel...");

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
                            ">${languageManager.translate(ORG_TEXTS.scene1.choices.a)}</div>
                            <div style="
                                font-size: 12px;
                                opacity: 0.55;
                                line-height: 1.5;
                                color: rgba(255,255,255,0.7);
                                font-family: 'Courier New', monospace;
                            ">▸ ${languageManager.translate({id: "Jujur meski dapat tugas berat", en: "Honest despite heavy task"})}</div>
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
                            ">${languageManager.translate(ORG_TEXTS.scene1.choices.b)}</div>
                            <div style="
                                font-size: 12px;
                                opacity: 0.55;
                                line-height: 1.5;
                                color: rgba(255,255,255,0.7);
                                font-family: 'Courier New', monospace;
                            ">▸ ${languageManager.translate({id: "Ikut serta korupsi", en: "Participate in corruption"})}</div>
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
                    border-color: rgba(255,100,100,0.5);
                    box-shadow: 0 4px 16px rgba(240,80,80,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
                }

                #choice-A:active, #choice-B:active {
                    transform: translateX(2px) scale(0.99);
                }
            </style>
        `;

        // Style the panel - positioned at bottom of screen with animation
        panel.style.cssText = `
            position: fixed;
            bottom: 12%;
            left: 50%;
            transform: translate(-50%, 0);
            z-index: 10000000;
            opacity: 0;
            animation: slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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

        // Keep speech bubble floating above the NPC if both exist
        if (this.npcSenior && this.speechBubbleGroup) {
            const npcPos = this.npcSenior.position;
            this.speechBubbleGroup.position.set(npcPos.x, npcPos.y + 18, npcPos.z);
        }

        // Update particle systems for atmospheric effects
        this.updateParticles();

        // Animate lights for dynamic atmosphere
        this.updateLights();

        // Check player proximity to NPC
        this.checkPlayerProximity();

        // Update spatial UI positions (restored for other systems)
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

    updateLights() {
        if (!this.lights) return;

        const time = this.experience.time.elapsed * 0.001;

        // Subtle pulsing effect on point lights
        if (this.lights.point1) {
            this.lights.point1.intensity = 1.2 + Math.sin(time * 0.5) * 0.2;
        }

        if (this.lights.point2) {
            this.lights.point2.intensity = 1.2 + Math.sin(time * 0.5 + Math.PI) * 0.2;
        }

        // Subtle flickering on NPC spotlight for cinematic feel
        if (this.lights.npcSpot) {
            this.lights.npcSpot.intensity = 2.0 + Math.sin(time * 2.0) * 0.1;
        }
    }

    applyCameraShake(intensity = 0.02, duration = 0.3) {
        // Apply subtle camera shake for immersion
        if (!this.experience.camera) return;

        const camera = this.experience.camera.perspectiveCamera || this.experience.camera.instance;
        if (!camera) return;

        // Store original position if not already stored
        if (!this.cameraOriginalPosition) {
            this.cameraOriginalPosition = camera.position.clone();
        }

        const startTime = this.experience.time.elapsed * 0.001;
        const shakeInterval = setInterval(() => {
            const currentTime = this.experience.time.elapsed * 0.001;
            const elapsed = currentTime - startTime;

            if (elapsed < duration) {
                // Apply random shake
                const shakeX = (Math.random() - 0.5) * intensity;
                const shakeY = (Math.random() - 0.5) * intensity;
                const shakeZ = (Math.random() - 0.5) * intensity;

                camera.position.x = this.cameraOriginalPosition.x + shakeX;
                camera.position.y = this.cameraOriginalPosition.y + shakeY;
                camera.position.z = this.cameraOriginalPosition.z + shakeZ;
            } else {
                // Reset to original position
                camera.position.copy(this.cameraOriginalPosition);
                clearInterval(shakeInterval);
            }
        }, 16); // ~60fps
    }

    createIntroAnimation() {
        // Cinematic intro with camera movement
        console.log("[OrgScene1] Creating cinematic intro animation...");

        const camera = this.experience.camera.perspectiveCamera || this.experience.camera.instance;
        if (!camera) return;

        // Store original FOV
        const originalFOV = camera.fov;

        // Smooth FOV transition (cinematic opening)
        let startFOV = 50;
        camera.fov = startFOV;
        camera.updateProjectionMatrix();

        const fovAnimation = setInterval(() => {
            if (camera.fov < originalFOV) {
                camera.fov += 0.5;
                camera.updateProjectionMatrix();
            } else {
                camera.fov = originalFOV;
                camera.updateProjectionMatrix();
                clearInterval(fovAnimation);
            }
        }, 16);
    }

    dispose() {
        console.log("[Organization] Disposing Organization scene...");

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

        // Clear fog
        if (this.scene.fog) {
            this.scene.fog = null;
        }

        // Detach resource listeners so the loading bar does not keep updating after the scene is gone.
        if (this.resources && typeof this.resources.removeListener === 'function') {
            if (this.resourceLoadingHandler) {
                this.resources.removeListener('loading', this.resourceLoadingHandler);
            }
            if (this.resourceReadyHandler) {
                this.resources.removeListener('ready', this.resourceReadyHandler);
            }
        }
        this.resourceLoadingHandler = null;
        this.resourceReadyHandler = null;

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
        this.pendingDialogue = null;
        this.hasSpokenDialogue = false;

        // Clean up event listeners
        if (this.canvas && this.onMouseClick && this.onMouseMove) {
            this.canvas.removeEventListener('click', this.onMouseClick);
            this.canvas.removeEventListener('mousemove', this.onMouseMove);
            this.canvas.removeEventListener('touchend', this.onTouchEnd);
            this.canvas.removeEventListener('touchmove', this.onTouchMove);
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