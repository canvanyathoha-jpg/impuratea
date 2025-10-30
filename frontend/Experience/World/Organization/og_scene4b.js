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
        
        // Load scene models in background first (they'll be hidden by overlay)
        this.setWorld();
        this.createPortals();
        this.createNPC();
        
        // Wait a moment for scene to load, then show opening story overlay
        setTimeout(() => {
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
        }, 500); // Short delay to let scene start loading
    }

    setWorld() {
        console.log("[OrgScene4B] setWorld() called");
        
        // Create a group for all collidable objects
        const collidableGroup = new THREE.Group();

        // Load the RuangGuru model
        console.log("[OrgScene4B] Loading RuangGuru model...");
        this.ruangGuruModel = this.resources.items.ruangguru.scene;
        this.ruangGuruModel.position.set(0, 0, 0);
        this.ruangGuruModel.rotation.set(0, 0, 0);
        this.ruangGuruModel.scale.set(12, 12, 12);
        collidableGroup.add(this.ruangGuruModel);

        // Setup collider for physics - match the RuangGuru model scale
        console.log("[OrgScene4B] Loading collider...");
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
            console.log("[OrgScene4B] Camera collision objects set");
        }

        console.log("Organization Scene 4B (RuangGuru) loaded with full collision enabled.");
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
        
        const maleModel = this.resources.items.male;
        if (!maleModel) {
            console.error("[OrgScene4B] Male avatar model not found!");
            return;
        }

        // Create Pembina OSIS NPC
        this.npcPembina = SkeletonUtils.clone(maleModel.scene);
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
            this.handleChoice('A');
        });

        document.getElementById('choice-B').addEventListener('click', () => {
            console.log("[OrgScene4B] Player chose B");
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

        // Update corruption score
        const totalScore = parseInt(localStorage.getItem('corruption-score') || '0') + scoreIncrease;
        localStorage.setItem('corruption-score', totalScore.toString());
        console.log(`[OrgScene4B] Total corruption score: ${totalScore}`);

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
    }
}
