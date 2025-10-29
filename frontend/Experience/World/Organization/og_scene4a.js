import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import Portal from "../Portal.js";
import UIManager from "../../Utils/UIManager.js";
import OpeningStory, { SCENE_DATA } from "../../Utils/OpeningStory.js";
import Ending from "../../Utils/Ending.js";

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
        console.log("[OrgScene4A] Loading scene in background first...");
        
        // Load scene models in background first (they'll be hidden by overlay)
        this.setWorld();
        this.createPortals();
        this.createNPC();
        
        // Wait a moment for scene to load, then show opening story overlay
        setTimeout(() => {
            console.log("[OrgScene4A] Scene loaded, now showing opening story overlay...");
            
            try {
                this.openingStory = new OpeningStory(SCENE_DATA.og_scene4a);
                
                // Show opening story overlay (blocks screen with z-index 10000000)
                this.openingStory.show().then(() => {
                    console.log("[OrgScene4A] Opening story dismissed - scene is now fully visible");
                    
                    // Auto-start conversation after opening story (no proximity needed)
                    setTimeout(() => {
                        console.log("[OrgScene4A] Auto-starting conversation...");
                        this.startConversation();
                    }, 2000);
                }).catch((error) => {
                    console.error("[OrgScene4A] Error in opening story:", error);
                });
            } catch (error) {
                console.error("[OrgScene4A] Error creating opening story:", error);
            }
        }, 500); // Short delay to let scene start loading
    }

    setWorld() {
        console.log("[OrgScene4A] setWorld() called");
        
        // Create a group for all collidable objects
        const collidableGroup = new THREE.Group();

        // Load the RuangGuru model
        console.log("[OrgScene4A] Loading RuangGuru model...");
        this.ruangGuruModel = this.resources.items.ruangguru.scene;
        this.ruangGuruModel.position.set(0, 0, 0);
        this.ruangGuruModel.rotation.set(0, 0, 0);
        this.ruangGuruModel.scale.set(12, 12, 12);
        collidableGroup.add(this.ruangGuruModel);

        // Setup collider for physics - match the RuangGuru model scale
        console.log("[OrgScene4A] Loading collider...");
        this.collider = this.resources.items.collider.scene;
        this.collider.position.set(0, 0, 0);
        this.collider.rotation.set(0, 0, 0);
        this.collider.scale.set(12, 12, 12);

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
            console.log("[OrgScene4A] Camera collision objects set");
        }

        console.log("Organization Scene 4A (RuangGuru) loaded with full collision enabled.");
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
        
        const maleModel = this.resources.items.male;
        if (!maleModel) {
            console.error("[OrgScene4A] Male avatar model not found!");
            return;
        }

        // Create Pembina OSIS NPC
        this.npcPembina = SkeletonUtils.clone(maleModel.scene);
        this.npcPembina.position.set(8, -2, 15); // Position in RuangGuru
        this.npcPembina.rotation.y = Math.PI;
        this.npcPembina.scale.set(9, 9, 9);
        this.scene.add(this.npcPembina);

        // Setup animations
        this.setupNPCAnimations();

        // Initialize UIManager
        this.uiManager = new UIManager();

        console.log("[OrgScene4A] Pembina NPC created successfully");
    }

    setupNPCAnimations() {
        this.npcAnimations = this.resources.items.male.animations.map((clip) => clip.clone());
        
        this.npcMixer = new THREE.AnimationMixer(this.npcPembina);
        this.npcActions = {};
        this.npcActions.idle = this.npcMixer.clipAction(this.npcAnimations[1]);
        this.npcCurrentAction = this.npcActions.idle;
        this.npcCurrentAction.play();
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
        
        this.speechBubbleGroup.position.set(4, 16, 15);
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
        
        // Dialog dari pembina - marah karena tidak ada vendor
        const dialogue = "Kamu tidak bisa menemukan vendor!\nSaya perlu laporan keuangan\nuntuk melihat keberlangsungan\nacara ke depannya.";
        
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
        // Remove existing button if any
        const existingBtn = document.getElementById('speech-bubble-alt-button');
        if (existingBtn) {
            existingBtn.remove();
        }

        this.alternativeButton = document.createElement('button');
        this.alternativeButton.id = 'speech-bubble-alt-button';
        this.alternativeButton.textContent = 'Klik untuk melihat dialog di layar';
        this.alternativeButton.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background: linear-gradient(135deg, #1E407C 0%, #8B0000 50%, #FFD700 100%);
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            z-index: 10000001;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        `;
        
        this.alternativeButton.addEventListener('mouseenter', () => {
            this.alternativeButton.style.transform = 'translateX(-50%) scale(1.05)';
            this.alternativeButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
        });
        
        this.alternativeButton.addEventListener('mouseleave', () => {
            this.alternativeButton.style.transform = 'translateX(-50%) scale(1)';
            this.alternativeButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        });
        
        this.alternativeButton.addEventListener('click', () => {
            this.showScreenSpeechBubble();
        });
        
        document.body.appendChild(this.alternativeButton);
    }

    showScreenSpeechBubble() {
        // Remove existing bubble if any
        const existingBubble = document.getElementById('screen-speech-bubble');
        if (existingBubble) {
            existingBubble.remove();
        }

        this.screenBubble = document.createElement('div');
        this.screenBubble.id = 'screen-speech-bubble';
        this.screenBubble.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(30, 64, 124, 0.95), rgba(139, 0, 0, 0.95)); border: 3px solid rgba(255,255,255,0.5); border-radius: 20px; padding: 30px; max-width: 600px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
                <div style="font-size: 24px; font-weight: bold; color: #FFD700; margin-bottom: 15px; text-align: center;">
                    Pembina OSIS
                </div>
                <div style="font-size: 18px; color: #fff; line-height: 1.6; text-align: center;">
                    "Kamu tidak bisa menemukan vendor! Saya perlu laporan keuangan untuk melihat keberlangsungan acara ke depannya."
                </div>
            </div>
        `;

        this.screenBubble.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000001;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        document.body.appendChild(this.screenBubble);

        setTimeout(() => {
            this.screenBubble.style.opacity = '1';
        }, 100);
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
        console.log("[OrgScene4A] Creating choice panel...");
        
        // Remove existing choice panel if any
        if (this.choicePanel) {
            this.choicePanel.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'choice-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid rgba(255, 215, 0, 0.8);
            border-radius: 20px;
            padding: 30px;
            max-width: 800px;
            width: 90%;
            z-index: 10000000;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            opacity: 0;
            transition: opacity 0.5s ease;
        `;

        panel.innerHTML = `
            <div style="color: #FFD700; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center;">
                Pilihan Kamu
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <button id="choice-A" data-choice="A" style="
                    padding: 20px;
                    background: linear-gradient(135deg, rgba(30, 64, 124, 0.8), rgba(139, 0, 0, 0.8));
                    border: 2px solid rgba(255, 215, 0, 0.6);
                    border-radius: 15px;
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                ">
                    <div style="font-size: 20px; margin-bottom: 10px; color: #FFD700;">A</div>
                    <div>Memberikan laporan dana secara transparan dan dimarahi pembina</div>
                    <div style="margin-top: 10px; font-size: 14px; color: #4ecdc4;">+0%</div>
                </button>
                <button id="choice-B" data-choice="B" style="
                    padding: 20px;
                    background: linear-gradient(135deg, rgba(30, 64, 124, 0.8), rgba(139, 0, 0, 0.8));
                    border: 2px solid rgba(255, 215, 0, 0.6);
                    border-radius: 15px;
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                ">
                    <div style="font-size: 20px; margin-bottom: 10px; color: #FFD700;">B</div>
                    <div>Manipulasi laporan dana dan pembina memberikan kesempatan</div>
                    <div style="margin-top: 10px; font-size: 14px; color: #4ecdc4;">+25%</div>
                </button>
            </div>
        `;

        document.body.appendChild(panel);

        // Fade in
        setTimeout(() => {
            panel.style.opacity = '1';
        }, 100);

        // Add event listeners
        panel.querySelector('#choice-A').addEventListener('click', () => {
            this.handleChoice('A');
        });

        panel.querySelector('#choice-B').addEventListener('click', () => {
            this.handleChoice('B');
        });

        // Hover effects
        panel.querySelectorAll('button').forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'scale(1.05)';
                button.style.borderColor = 'rgba(255, 215, 0, 1)';
                button.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'scale(1)';
                button.style.borderColor = 'rgba(255, 215, 0, 0.6)';
                button.style.boxShadow = 'none';
            });
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

        // Update corruption score
        const totalScore = parseInt(localStorage.getItem('corruption-score') || '0') + scoreIncrease;
        localStorage.setItem('corruption-score', totalScore.toString());
        console.log(`[OrgScene4A] Total corruption score: ${totalScore}`);

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
                    "Kebenaran sering dimarahi sebelum akhirnya dipercaya."
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

        this.checkPlayerProximity();

        if (this.uiManager) {
            this.uiManager.updatePositions();
        }
    }

    dispose() {
        console.log("[OrganizationScene4A] Disposing...");

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
    }
}
