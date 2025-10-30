import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import Portal from "../Portal.js";
import UIManager from "../../Utils/UIManager.js";
import OpeningStory, { SCENE_DATA } from "../../Utils/OpeningStory.js";
import Ending from "../../Utils/Ending.js";

export default class OrganizationScene2A {
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
        console.log("[OrgScene2A] Loading scene in background first...");
        
        // Load scene models in background first (they'll be hidden by overlay)
        this.setWorld();
        this.createPortals();
        this.createNPCs();
        
        // Wait a moment for scene to load, then show opening story overlay
        setTimeout(() => {
            console.log("[OrgScene2A] Scene loaded, now showing opening story overlay...");
            
            try {
                this.openingStory = new OpeningStory(SCENE_DATA.og_scene2a);
                
                // Show opening story overlay (blocks screen with z-index 10000000)
                this.openingStory.show().then(() => {
                    console.log("[OrgScene2A] Opening story dismissed - scene is now fully visible");
                }).catch((error) => {
                    console.error("[OrgScene2A] Error in opening story:", error);
                });
            } catch (error) {
                console.error("[OrgScene2A] Error creating opening story:", error);
            }
        }, 500); // Short delay to let scene start loading
    }

    setWorld() {
        console.log("[OrgScene2A] setWorld() called");
        
        // Create a group for all collidable objects
        const collidableGroup = new THREE.Group();

        // Load the organization model - 7x scale (same as scene1)
        console.log("[OrgScene2A] Loading organization model...");
        this.organizationModel = this.resources.items.organization.scene;
        this.organizationModel.position.set(0, 0, 0);
        this.organizationModel.rotation.set(0, 0, 0);
        this.organizationModel.scale.set(7, 7, 7);
        collidableGroup.add(this.organizationModel);

        // Setup collider for physics - match the organization model scale
        console.log("[OrgScene2A] Loading collider...");
        this.collider = this.resources.items.collider.scene;
        this.collider.position.set(0, 0, 0);
        this.collider.rotation.set(0, 0, 0);
        this.collider.scale.set(7, 7, 7);

        // Make collider invisible
        this.collider.traverse((child) => {
            if (child.isMesh) {
                child.visible = false;
            }
        });
        collidableGroup.add(this.collider);

        // Add the group to the scene
        this.scene.add(collidableGroup);

        // Build the octree
        this.octree.fromGraphNode(collidableGroup);

        // Set collision objects for camera
        if (this.experience.camera && this.experience.camera.controls) {
            this.experience.camera.controls.collisionObjects = this.collider;
            console.log("[OrgScene2A] Camera collision objects set");
        }

        console.log("Organization Scene 2A loaded with full collision enabled.");
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
        console.log("[OrgScene2A] Creating NPCs...");
        
        // Load male model
        const maleModel = this.resources.items.male;
        if (!maleModel) {
            console.error("[OrgScene2A] Male avatar model not found!");
            return;
        }

        // Create Senior NPC
        this.npcSenior = SkeletonUtils.clone(maleModel.scene);
        this.npcSenior.position.set(8, -2, 21);
        this.npcSenior.rotation.y = Math.PI;
        this.npcSenior.scale.set(9, 9, 9);
        this.scene.add(this.npcSenior);

        // Create Ketua OSIS NPC (positioned next to Senior)
        this.npcKetua = SkeletonUtils.clone(maleModel.scene);
        this.npcKetua.position.set(12, -2, 21);
        this.npcKetua.rotation.y = Math.PI;
        this.npcKetua.scale.set(9, 9, 9);
        this.scene.add(this.npcKetua);

        // Setup animations for both NPCs
        this.setupNPCAnimations();

        // Initialize UIManager
        this.uiManager = new UIManager();

        console.log("[OrgScene2A] NPCs created successfully");
    }

    setupNPCAnimations() {
        // Get animations from male model
        this.npcAnimations = this.resources.items.male.animations.map((clip) => clip.clone());
        
        // Setup Senior animation mixer
        this.npcMixerSenior = new THREE.AnimationMixer(this.npcSenior);
        this.npcActionsSenior = {};
        this.npcActionsSenior.dancing = this.npcMixerSenior.clipAction(this.npcAnimations[0]);
        this.npcActionsSenior.idle = this.npcMixerSenior.clipAction(this.npcAnimations[1]);
        this.npcActionsSenior.jumping = this.npcMixerSenior.clipAction(this.npcAnimations[2]);
        this.npcActionsSenior.running = this.npcMixerSenior.clipAction(this.npcAnimations[3]);
        this.npcActionsSenior.walking = this.npcMixerSenior.clipAction(this.npcAnimations[4]);
        this.npcActionsSenior.waving = this.npcMixerSenior.clipAction(this.npcAnimations[5]);
        this.npcCurrentActionSenior = this.npcActionsSenior.idle;
        this.npcCurrentActionSenior.play();

        // Setup Ketua animation mixer
        this.npcMixerKetua = new THREE.AnimationMixer(this.npcKetua);
        this.npcActionsKetua = {};
        this.npcActionsKetua.dancing = this.npcMixerKetua.clipAction(this.npcAnimations[0]);
        this.npcActionsKetua.idle = this.npcMixerKetua.clipAction(this.npcAnimations[1]);
        this.npcActionsKetua.jumping = this.npcMixerKetua.clipAction(this.npcAnimations[2]);
        this.npcActionsKetua.running = this.npcMixerKetua.clipAction(this.npcAnimations[3]);
        this.npcActionsKetua.walking = this.npcMixerKetua.clipAction(this.npcAnimations[4]);
        this.npcActionsKetua.waving = this.npcMixerKetua.clipAction(this.npcAnimations[5]);
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

        // Auto-start conversation when player gets close
        if (distance < 50 && !this.conversationStarted) {
            if (!this.isPlayerNear) {
                this.isPlayerNear = true;
                console.log("[OrgScene2A] Player near NPC, starting conversation automatically");
                this.startConversation();
            }
        } else {
            if (this.isPlayerNear && !this.conversationStarted) {
                this.isPlayerNear = false;
            }
        }
    }

    startConversation() {
        console.log("[OrgScene2A] Starting conversation...");
        this.conversationStarted = true;

        // Create speech bubble
        this.createSimpleSpeechBubble();

        // Show choice panel after a delay
        setTimeout(() => {
            console.log("[OrgScene2A] Showing choices...");
            this.showChoices();
        }, 6000);
    }

    createSimpleSpeechBubble() {
        // Remove existing bubble if any
        const existingBubble = document.getElementById('senior-speech-bubble');
        if (existingBubble) {
            existingBubble.remove();
        }

        // Create 3D speech bubble using Three.js
        this.create3DSpeechBubble();
    }

    create3DSpeechBubble() {
        // Create a group for the speech bubble
        this.speechBubbleGroup = new THREE.Group();
        
        // Create speech bubble background
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
        
        // Create speech bubble border
        const borderGeometry = new THREE.PlaneGeometry(8.2, 4.2);
        const borderMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: false,
            opacity: 1.0,
            side: THREE.FrontSide,
            depthWrite: false
        });
        this.speechBubbleBorder = new THREE.Mesh(borderGeometry, borderMaterial);
        
        // Create speech bubble tail
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
        
        // Add all elements to group
        this.speechBubbleGroup.add(this.speechBubbleBorder);
        this.speechBubbleGroup.add(this.speechBubblePlane);
        this.speechBubbleGroup.add(this.speechBubbleArrow);
        
        // Create text texture for the speech bubble
        this.createSpeechTextTexture();
        
        // Position above NPC
        this.speechBubbleGroup.position.set(4, 16, 21);
        this.speechBubbleGroup.rotation.y = Math.PI;
        
        // Add to scene
        this.scene.add(this.speechBubbleGroup);
        
        // Add alternative button for reading speech bubble
        this.createAlternativeButton();
    }

    createSpeechTextTexture() {
        // Create canvas for text
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
        
        // Draw title
        context.strokeText('Senior Bendahara:', canvas.width / 2, 100);
        context.fillText('Senior Bendahara:', canvas.width / 2, 100);
        
        context.font = 'bold 36px Arial';
        
        // Draw dialogue text (diperbaiki agar lebih mudah dipahami)
        const dialogue = "Uang ini akan saya berikan ke Ketua OSIS.\nDia yang akan menyiapkan acaranya,\njadi tugas kamu lebih ringan.";
        
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
            console.log("[OrgScene2A] Alternative button clicked!");
            this.showScreenSpeechBubble();
        });
    }

    showScreenSpeechBubble() {
        const screenBubble = document.createElement('div');
        screenBubble.id = 'screen-speech-bubble';
        screenBubble.innerHTML = `
            <div style="position: fixed; top: 20%; left: 50%; transform: translateX(-50%); background: white; border: 3px solid #333; border-radius: 20px; padding: 30px; max-width: 600px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); z-index: 10000001; cursor: pointer;">
                <div style="font-size: 24px; font-weight: bold; color: #000; margin-bottom: 15px; text-align: center;">
                    Senior Bendahara:
                </div>
                <div style="font-size: 18px; color: #000; line-height: 1.6; text-align: center;">
                    Uang ini akan saya berikan ke Ketua OSIS. Dia yang akan menyiapkan acaranya, jadi tugas kamu lebih ringan.
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #666;">
                    Klik untuk menutup
                </div>
            </div>
        `;

        document.body.appendChild(screenBubble);
        
        screenBubble.addEventListener('click', () => {
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
        console.log("[OrgScene2A] Creating choice panel...");
        
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
                            <div style="font-weight: 600; font-size: 17px; line-height: 1.3;">Tetap menolak dan tidak memberikan uang</div>
                        </div>
                    </button>
                    <button id="choice-B" style="display: flex; align-items: center; gap: 15px; padding: 18px 22px; background: rgba(244,67,54,0.15); border: 2px solid rgba(244,67,54,0.5); border-radius: 12px; color: white; cursor: pointer; transition: all 0.3s ease; text-align: left; font-size: 16px;">
                        <span style="font-size: 24px; font-weight: bold; min-width: 35px; text-align: center; color: #f44336;">B</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 17px; line-height: 1.3;">Memberikan uang dan memanipulasi laporan</div>
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
            pointer-events: all;
        `;

        document.body.appendChild(panel);

        setTimeout(() => {
            panel.style.opacity = '1';
        }, 100);

        // Add event listeners
        document.getElementById('choice-A').addEventListener('click', () => {
            console.log("[OrgScene2A] Player chose A");
            this.handleChoice('A');
        });

        document.getElementById('choice-B').addEventListener('click', () => {
            console.log("[OrgScene2A] Player chose B");
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
        console.log(`[OrgScene2A] Player chose: ${choiceId}`);

        let scoreIncrease = 0;
        let nextScene = null; // Default: end of game

        if (choiceId === 'A') {
            // Pilihan A: Tetap jujur → Scene 3A
            scoreIncrease = 0;
            nextScene = 'og_scene3a';
            console.log(`[OrgScene2A] Choice A → Load og_scene3a`);
        } else if (choiceId === 'B') {
            // Pilihan B: Memberikan uang → End game (menutupi masalah)
            scoreIncrease = 25;
            nextScene = null;
            console.log(`[OrgScene2A] Choice B → End game`);
        }

        // Update corruption score
        const totalScore = parseInt(localStorage.getItem('corruption-score') || '0') + scoreIncrease;
        localStorage.setItem('corruption-score', totalScore.toString());
        console.log(`[OrgScene2A] Total corruption score: ${totalScore}`);

        // Store nextScene untuk digunakan di showSupplementMessage
        this.nextScene = nextScene;

        // Show supplement message
        this.showSupplementMessage();

        // Remove UI elements
        if (this.uiManager) {
            this.uiManager.removeChoicePanel();
        }

        // Load next scene if any, atau tampilkan ending jika end game
        if (nextScene) {
            setTimeout(() => {
                this.loadScene(nextScene);
            }, 5500); // Wait for message to show
        }
    }

    loadScene(sceneName) {
        console.log(`[OrgScene2A] Loading scene: ${sceneName}`);
        
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
            console.log(`[OrgScene2A] Switching to scene: ${sceneName}`);
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
                    "Tekanan dari atasan sering menguji batas. Bukan tentang berani melawan, tapi berani tetap jujur walau semua mendesak agar melakukan sebaliknya."
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

        // Auto close after 5 seconds
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(message)) {
                    document.body.removeChild(message);
                }
                
                // Tampilkan ending jika tidak ada next scene (end game)
                if (!this.nextScene) {
                    console.log("[OrgScene2A] Showing ending...");
                    this.showEnding();
                }
            }, 500);
        }, 5000);
    }

    showEnding() {
        // Import dan tampilkan ending
        const ending = new Ending();
        ending.show().then(() => {
            console.log("[OrgScene2A] Ending displayed");
        }).catch((error) => {
            console.error("[OrgScene2A] Error showing ending:", error);
        });
    }

    update() {
        // Update portal animation
        if (this.westgatePortal) {
            this.westgatePortal.update();
        }

        // Update NPC animations
        if (this.npcMixerSenior) {
            this.npcMixerSenior.update(this.experience.time.delta * 0.001);
        }

        if (this.npcMixerKetua) {
            this.npcMixerKetua.update(this.experience.time.delta * 0.001);
        }

        // Check player proximity to NPC
        this.checkPlayerProximity();

        // Update UI positions
        if (this.uiManager) {
            this.uiManager.updatePositions();
        }
    }

    dispose() {
        console.log("[OrganizationScene2A] Disposing Organization Scene 2A...");

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

        // Clean up choice panel
        if (this.choicePanel) {
            this.choicePanel.remove();
            this.choicePanel = null;
        }

        // Clean up 3D speech bubble
        if (this.speechBubbleGroup) {
            this.scene.remove(this.speechBubbleGroup);
            this.speechBubbleGroup = null;
        }

        // Clean up opening story
        if (this.openingStory) {
            this.openingStory.dispose();
            this.openingStory = null;
        }

        // Dispose UIManager
        if (this.uiManager) {
            this.uiManager.dispose();
            this.uiManager = null;
        }

        // Remove NPCs
        if (this.npcSenior) {
            this.scene.remove(this.npcSenior);
            this.npcSenior = null;
        }

        if (this.npcKetua) {
            this.scene.remove(this.npcKetua);
            this.npcKetua = null;
        }
        
        // Clean up animation mixers
        if (this.npcMixerSenior) {
            this.npcMixerSenior.stopAllAction();
            this.npcMixerSenior = null;
        }

        if (this.npcMixerKetua) {
            this.npcMixerKetua.stopAllAction();
            this.npcMixerKetua = null;
        }
        
        if (this.npcActionsSenior) {
            this.npcActionsSenior = null;
        }

        if (this.npcActionsKetua) {
            this.npcActionsKetua = null;
        }
        
        if (this.npcAnimations) {
            this.npcAnimations = null;
        }

        // Remove portal
        if (this.westgatePortal) {
            this.westgatePortal.dispose();
            this.westgatePortal = null;
        }

        // Remove model from scene
        if (this.organizationModel && this.organizationModel.parent) {
            this.scene.remove(this.organizationModel.parent);
        }

        console.log("[OrganizationScene2A] Organization Scene 2A disposed");
    }
}
