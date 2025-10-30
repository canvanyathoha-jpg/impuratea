import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import Portal from "../Portal.js";
import UIManager from "../../Utils/UIManager.js";
import OpeningStory, { SCENE_DATA } from "../../Utils/OpeningStory.js";

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
        
        // Load scene models in background first (they'll be hidden by overlay)
        this.setWorld();
        this.createPortals();
        this.createNPCs();
        
        // Wait a moment for scene to load, then show opening story overlay
        setTimeout(() => {
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
        }, 500); // Short delay to let scene start loading
    }

    setWorld() {
        console.log("[OrgScene2B] setWorld() called");
        
        // Create a group for all collidable objects
        const collidableGroup = new THREE.Group();

        // Load the organization model - 7x scale (same as scene1)
        console.log("[OrgScene2B] Loading organization model...");
        this.organizationModel = this.resources.items.organization.scene;
        this.organizationModel.position.set(0, 0, 0);
        this.organizationModel.rotation.set(0, 0, 0);
        this.organizationModel.scale.set(7, 7, 7);
        collidableGroup.add(this.organizationModel);

        // Setup collider for physics - match the organization model scale
        console.log("[OrgScene2B] Loading collider...");
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
            console.log("[OrgScene2B] Camera collision objects set");
        }

        console.log("Organization Scene 2B loaded with full collision enabled.");
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
            this.handleChoice('A');
        });

        document.getElementById('choice-B').addEventListener('click', () => {
            console.log("[OrgScene2B] Player chose B");
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

        // Update corruption score
        const totalScore = parseInt(localStorage.getItem('corruption-score') || '0') + scoreIncrease;
        localStorage.setItem('corruption-score', totalScore.toString());
        console.log(`[OrgScene2B] Total corruption score: ${totalScore}`);

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

        console.log("[OrganizationScene2B] Disposed");
    }
}
