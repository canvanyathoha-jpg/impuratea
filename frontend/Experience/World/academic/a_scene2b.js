import Experience from "../../Experience.js";
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import DialogManager from "../../Utils/DialogManager.js";
import SpeechAudioManager from "../../Utils/SpeechAudioManager.js";
import { languageManager } from "../../Utils/LanguageManager.js";

export default class AcademicScene2B {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.dialogManager = new DialogManager(this.experience);
        this.speechAudioManager = new SpeechAudioManager();
        this.npcGender = 'female'; // NPC di scene 2b menggunakan model female
        this.npcDeskmate = null;
        this.speechBubbleGroup = null;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.canvas = this.experience.canvas;
        this.canvas.addEventListener('click', this.onMouseClick.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));

        // Show loading indicator and load scene asynchronously
        this.initWithPreloader();
    }

    initWithPreloader() {
        console.log("[AcademicScene2B] Loading scene in background first...");
        this.showLoadingIndicator();
        this.loadSceneAsync().then(() => {
            console.log("[AcademicScene2B] Scene loaded successfully!");
            this.hideLoadingIndicator();
            setTimeout(() => {
                this.startStory();
            }, 1000);
        }).catch((error) => {
            console.error("[AcademicScene2B] Error loading scene:", error);
            this.hideLoadingIndicator();
        });
    }

    setWorld() {
        const collidableGroup = new THREE.Group();

        this.classModel = this.resources.items.class.scene;
        this.classModel.position.set(0, 0, 0);
        this.classModel.rotation.set(0, 0, 0);
        this.classModel.scale.set(10, 10, 10);
        collidableGroup.add(this.classModel);

        this.collider = this.resources.items.collider.scene;
        this.collider.position.set(0, 0, 0);
        this.collider.rotation.set(0, 0, 0);
        this.collider.scale.set(10, 10, 10);

        this.collider.traverse((child) => {
            if (child.isMesh) {
                child.visible = false;
            }
        });
        collidableGroup.add(this.collider);

        this.scene.add(collidableGroup);
        this.octree.fromGraphNode(collidableGroup);

        if (this.experience.camera && this.experience.camera.controls) {
            this.experience.camera.controls.collisionObjects = this.collider;
        }

        console.log("Academic Scene 2B loaded");
    }

    createNPC() {
        console.log("[AcademicScene2B] Creating Deskmate NPC...");

        const femaleModel = this.resources.items.female;
        if (!femaleModel) {
            console.error("[AcademicScene2B] Female avatar model not found!");
            return;
        }

        this.npcDeskmate = SkeletonUtils.clone(femaleModel.scene);
        this.npcDeskmate.position.set(-47, 1.5, 23);
        this.npcDeskmate.rotation.y = Math.atan2(0 - this.npcDeskmate.position.x, 0 - this.npcDeskmate.position.z) + Math.PI / 2;
        this.npcDeskmate.scale.set(9, 9, 9);
        this.scene.add(this.npcDeskmate);

        // Safely clone animations - check if animations array exists
        this.npcAnimations = (femaleModel.animations && Array.isArray(femaleModel.animations)) 
            ? femaleModel.animations.map((clip) => clip.clone()) 
            : [];
        
        console.log("[AcademicScene2B] Available animations:", this.npcAnimations.length);
        console.log("[AcademicScene2B] Animation names:", this.npcAnimations.map(clip => clip.name));
        
        this.npcMixer = new THREE.AnimationMixer(this.npcDeskmate);
        this.npcActions = {};

        // Safely setup animations - only create clipActions for animations that exist
        const idleClip = this.npcAnimations.find(clip => clip && clip.name && clip.name.toLowerCase().includes('idle')) 
            || this.npcAnimations.find(clip => clip && clip.name) 
            || (this.npcAnimations.length > 0 ? this.npcAnimations[0] : null);
        
        if (idleClip) {
            try {
                this.npcActions.idle = this.npcMixer.clipAction(idleClip);
                console.log("[AcademicScene2B] Idle animation created:", idleClip.name);
                this.npcActions.idle.play();
            } catch (error) {
                console.warn("[AcademicScene2B] Failed to create/play idle animation:", error);
            }
        } else {
            console.warn("[AcademicScene2B] No idle animation found, NPC will be static");
        }

        console.log("[AcademicScene2B] Deskmate NPC created.");
    }

    startStory() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Beberapa hari setelah ujian... Kamu menerima hasilnya.",
                en: "A few days after the exam... You receive the results."
            }, 
            onChoice: () => setTimeout(() => this.showResult(), 50) 
        });
    }

    showResult() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Nilai ujianmu: 60. Orang tuamu kecewa dan memang menyita HP-mu untuk sementara. Tapi kamu merasa lega karena mengerjakan dengan jujur. Kamu punya waktu lebih banyak untuk belajar tanpa distraksi HP.",
                en: "Your exam score: 60. Your parents are disappointed and confiscate your phone temporarily. But you feel relieved because you worked honestly. You have more time to study without phone distractions."
            }, 
            onChoice: () => setTimeout(() => this.showMotivation(), 50) 
        });
    }

    showMotivation() {
        this.dialogManager.showDialog({ 
            speaker: {
                id: "Kamu (batin)",
                en: "You (inner thoughts)"
            }, 
            text: {
                id: "Memang awalnya berat, tapi aku merasa lebih tenang. Aku harus lebih giat belajar supaya nilai berikutnya lebih baik!",
                en: "It's hard at first, but I feel more at peace. I must study harder so the next score is better!"
            }, 
            onChoice: () => setTimeout(() => this.showNewAssignment(), 50) 
        });
    }

    showNewAssignment() {
        this.dialogManager.showDialog({ 
            speaker: {
                id: "Guru Biologi",
                en: "Biology Teacher"
            }, 
            text: {
                id: "Hari ini saya akan memberi tugas kelompok. Kalian harus membuat makalah 10 halaman tentang topik biologi. Dikerjakan berpasangan dengan teman sebangku. Deadline seminggu lagi!",
                en: "Today I will assign a group project. You must create a 10-page paper on a biology topic. Work in pairs with your deskmate. Deadline in one week!"
            }, 
            onChoice: () => setTimeout(() => this.showEagerness(), 50) 
        });
    }

    showEagerness() {
        this.dialogManager.showDialog({ 
            speaker: {
                id: "Kamu (batin)",
                en: "You (inner thoughts)"
            }, 
            text: {
                id: "Ini kesempatan untuk membuktikan bahwa aku bisa! Aku harus mendapat nilai terbaik untuk tugas ini!",
                en: "This is a chance to prove I can do it! I must get the best score for this assignment!"
            }, 
            onChoice: () => setTimeout(() => this.showOverwork(), 50) 
        });
    }

    showOverwork() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Pada hari pertama tugas diberikan, kamu langsung begadang untuk mengerjakan makalah sendirian. Kamu ingin membuktikan kesungguhanmu. Tapi tubuhmu tidak kuat... Keesokan harinya kamu jatuh sakit dan tidak bisa masuk sekolah selama 3 hari.",
                en: "On the first day the assignment is given, you immediately stay up all night working on the paper alone. You want to prove your dedication. But your body can't handle it... The next day you fall sick and can't go to school for 3 days."
            }, 
            onChoice: () => setTimeout(() => this.showPanic(), 50) 
        });
    }

    showPanic() {
        this.dialogManager.showDialog({ 
            speaker: {
                id: "Kamu (batin)",
                en: "You (inner thoughts)"
            }, 
            text: {
                id: "Sehari lagi deadline! Tapi makalahnya baru setengah jadi... Aku harus bagaimana?!",
                en: "One day until deadline! But the paper is only half done... What should I do?!"
            }, 
            onChoice: () => this.showFriendOffer() 
        });
    }

    showFriendOffer() {
        const speaker = {
            id: "Teman Sebangku (via chat)",
            en: "Deskmate (via chat)"
        };
        const text = {
            id: "Eh, aku dengar kamu sakit. Makalah kita gimana? Aku liat kamu udah bikin setengah. Mau gampang? Pake AI aja buat selesain sisanya. Cepet kok!",
            en: "Hey, I heard you're sick. How about our paper? I see you've done half. Want it easy? Just use AI to finish the rest. It's fast!"
        };

        this.create3DSpeechBubble(speaker, text, () => {
            this.showMainChoice();
        });
    }

    showMainChoice() {
        this.dialogManager.showDialog({
            text: {
                id: "Kamu dalam dilema besar. Waktu tinggal satu hari, kamu masih lemah karena baru sembuh, dan makalahnya baru setengah...",
                en: "You're in a tough dilemma. Only one day left, you're still weak after recovering, and the paper is only half done..."
            },
            choices: [
                { 
                    text: {
                        id: "Mengerjakan sendiri sampai tidak tidur. Hasilnya kurang bagus karena kondisi badan masih lemah.",
                        en: "Work alone through the night without sleep. The result isn't good because you're still physically weak."
                    }, 
                    score: 0, 
                    nextScene: 'a_scene3a' 
                },
                { 
                    text: {
                        id: "Menggunakan AI untuk menyelesaikan setengahnya lagi. Hasilnya bagus dan bisa istirahat.",
                        en: "Use an AI tool to finish the other half. The result looks great and you can rest."
                    }, 
                    score: 20, 
                    nextScene: 'a_scene3b' 
                }
            ],
            sublimentMessage: {
                id: "Ketika nilai jadi segalanya, integritas perlahan digadaikan.",
                en: "When grades become everything, integrity slowly gets compromised."
            },
            onChoice: (choice) => this.handleChoice(choice)
        });
    }

    handleChoice(choice) {
        if (!choice) {
            console.warn("[AcademicScene2B] Choice timer expired, defaulting to honest branch without changing score.");
            this.showPathA();
            return;
        }

        if (choice.nextScene === 'a_scene3a') {
            this.showPathA();
        } else {
            this.showPathB();
        }
    }

    showPathA() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Kamu memaksakan diri untuk begadang lagi meski badan masih lemah. Dengan mata berair dan kepala pusing, kamu menyelesaikan makalah. Hasilnya tidak semaksimal yang kamu inginkan, tapi ini hasil kerja kerasmu sendiri.",
                en: "You force yourself to stay up again even though your body is still weak. With bleary eyes and a spinning head, you finish the paper. The result isn't as perfect as you wanted, but it's still the product of your own hard work."
            }, 
            onChoice: () => this.showPathAResult() 
        });
    }

    showPathAResult() {
        this.dialogManager.showDialog({ 
            speaker: {
                id: "Guru Biologi",
                en: "Biology Teacher"
            }, 
            text: {
                id: "Makalah kalian... cukup baik. Ada beberapa bagian yang kurang detail, tapi saya bisa lihat usaha kalian. Nilai: 75. Pertahankan semangat ini!",
                en: "Your paper... is quite good. Some parts lack detail, but I can see your effort. Score: 75. Keep up the spirit!"
            }, 
            onChoice: () => this.transitionToNextScene('a_scene3a') 
        });
    }

    showPathB() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Kamu membuka AI dan menyalin separuh makalah yang sudah kamu buat, lalu meminta AI melengkapi sisanya. Dalam 1 jam, makalah selesai dengan rapi. Kamu bisa istirahat dan memulihkan kondisi.",
                en: "You open an AI tool and copy the half you've already written, then ask it to complete the rest. In one hour, the paper is neatly finished. You can rest and recover."
            }, 
            onChoice: () => this.showPathBResult() 
        });
    }

    showPathBResult() {
        this.dialogManager.showDialog({ 
            speaker: {
                id: "Guru Biologi",
                en: "Biology Teacher"
            }, 
            text: {
                id: "Excellent! Makalah kalian sangat lengkap dan terstruktur dengan baik! Ini salah satu yang terbaik di kelas. Nilai: 95!",
                en: "Excellent! Your paper is extremely complete and well-structured! This is one of the best in class. Score: 95!"
            }, 
            onChoice: () => this.showPathBConflict() 
        });
    }

    showPathBConflict() {
        this.dialogManager.showDialog({ 
            text: {
                id: "Kamu seharusnya senang, tapi ada perasaan hampa. Separuh dari makalah itu bukan hasil kerjamu. Apakah ini yang dimaksud dengan 'sukses'?",
                en: "You should be happy, but you feel empty. Half of that paper isn't your work. Is this what 'success' means?"
            }, 
            onChoice: () => this.transitionToNextScene('a_scene3b') 
        });
    }

    // --- Speech Bubble Logic ---

    create3DSpeechBubble(speaker, text, callback) {
        this.cleanupSpeechBubble();
        // Translate speaker and text
        const translatedSpeaker = languageManager.translate(speaker);
        const translatedText = languageManager.translate(text);
        this.speechBubbleGroup = new THREE.Group();
        this.speechBubbleGroup.userData = { speaker: translatedSpeaker, text: translatedText, callback };

        // Create enhanced bubble with better visual design
        const bubblePlane = new THREE.Mesh(
            new THREE.PlaneGeometry(9, 5),
            new THREE.MeshBasicMaterial({ 
                color: 0xffffff, // Background putih lebih terang
                side: THREE.FrontSide, 
                depthWrite: false,
                transparent: true,
                opacity: 0.98 // Hampir tidak transparan untuk kontras lebih baik
            })
        );
        this.speechBubbleMaterial = bubblePlane.material;

        // Outer glow effect untuk depth
        const outerGlow = new THREE.Mesh(
            new THREE.PlaneGeometry(9.4, 5.4),
            new THREE.MeshBasicMaterial({ 
                color: 0x2196f3, // Biru cerah untuk glow
                side: THREE.FrontSide, 
                depthWrite: false,
                transparent: true,
                opacity: 0.3 // Soft glow effect
            })
        );
        
        // Enhanced border yang lebih tebal dan jelas
        const border = new THREE.Mesh(
            new THREE.PlaneGeometry(9.2, 5.2),
            new THREE.MeshBasicMaterial({ 
                color: 0x1976d2, // Biru solid untuk border
                side: THREE.FrontSide, 
                depthWrite: false,
                transparent: true,
                opacity: 0.95
            })
        );

        // Tambahkan semua elemen dalam urutan yang benar (dari belakang ke depan)
        this.speechBubbleGroup.add(outerGlow);
        this.speechBubbleGroup.add(border);
        this.speechBubbleGroup.add(bubblePlane);
        
        this.createSpeechTextTexture(translatedSpeaker, translatedText);

        const npcPosition = this.npcDeskmate.position.clone();
        this.speechBubbleGroup.position.set(npcPosition.x - 6, npcPosition.y + 15, npcPosition.z);
        this.speechBubbleGroup.rotation.y = Math.PI; 

        this.scene.add(this.speechBubbleGroup);
        // Dialog muncul otomatis tanpa perlu klik tombol "Baca Percakapan"
        setTimeout(() => {
            this.showScreenSpeechBubble(translatedSpeaker, translatedText, callback);
        }, 300);
        
        // Play speech audio menggunakan Web Speech API dengan voice sesuai gender NPC
        if (this.speechAudioManager && this.speechAudioManager.isSupported) {
            const fullText = `${translatedSpeaker}: ${translatedText}`;
            // Jangan set pitch/rate secara eksplisit - biarkan SpeechAudioManager set otomatis berdasarkan gender
            this.speechAudioManager.speak(fullText, {
                gender: this.npcGender, // Gunakan gender NPC yang sesuai (female untuk scene 2b)
                // Pitch dan rate akan otomatis di-set berdasarkan gender
                volume: 0.85
            });
        }
    }

    createSpeechTextTexture(speaker, text) {
        const canvas = document.createElement('canvas');
        // Increase canvas resolution untuk kualitas text yang lebih baik
        canvas.width = 2048;
        canvas.height = 1024;
        const context = canvas.getContext('2d');

        // Enable text rendering yang lebih baik
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        // Create beautiful gradient background yang lebih terang dan kontras lebih baik
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#ffffff'); // Putih murni di atas
        gradient.addColorStop(0.3, '#fafbff'); // Putih sedikit kebiruan
        gradient.addColorStop(0.7, '#f5f7ff'); // Biru sangat terang
        gradient.addColorStop(1, '#eff3ff'); // Biru terang di bawah
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw speaker name with MUCH LARGER font untuk visibility yang jauh lebih baik
        context.font = 'bold 140px "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", Arial, sans-serif';
        context.fillStyle = '#0d47a1';
        context.textAlign = 'center';
        context.textBaseline = 'top';
        context.shadowColor = 'rgba(25, 118, 210, 0.5)';
        context.shadowBlur = 12;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 3;
        context.fillText(speaker + ':', canvas.width / 2, 120);
        
        context.shadowColor = 'rgba(0, 0, 0, 0.2)';
        context.shadowBlur = 5;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 2;
        
        // Draw text dengan font JAUH LEBIH BESAR untuk visibility maksimal
        context.font = 'bold 110px "Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", Arial, sans-serif';
        context.fillStyle = '#000000';
        context.textAlign = 'center';
        
        const lines = this.getLines(context, text, canvas.width - 200);
        const lineHeight = 130;
        const startY = 320;
        
        lines.forEach((line, index) => {
            context.fillText(line, canvas.width / 2, startY + (index * lineHeight));
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // Gunakan texture filtering yang lebih baik
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const textMaterial = new THREE.MeshBasicMaterial({ 
            map: texture, 
            transparent: true, 
            depthWrite: false,
            alphaTest: 0.01 // Anti-aliasing yang lebih baik
        });
        // Sesuaikan ukuran plane dengan bubble yang lebih besar
        const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 4.6), textMaterial);
        textPlane.position.z = 0.02; // Sedikit lebih ke depan

        this.speechBubbleGroup.add(textPlane);
    }

    getLines(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    onMouseMove(event) {
        if (!this.speechBubbleGroup) return;
        
        // Check if camera is available before using raycaster
        if (!this.experience || !this.experience.camera || !this.experience.camera.instance) {
            return; // Camera not ready yet, skip raycasting
        }
        
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        try {
            this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
            const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);
            this.canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
        } catch (error) {
            console.warn("[AcademicScene2B] Error setting raycaster from camera:", error);
        }
    }

    onMouseClick(event) {
        if (!this.speechBubbleGroup) return;
        
        // Check if camera is available before using raycaster
        if (!this.experience || !this.experience.camera || !this.experience.camera.instance) {
            return; // Camera not ready yet, skip raycasting
        }
        
        try {
            this.raycaster.setFromCamera(this.mouse, this.experience.camera.instance);
            const intersects = this.raycaster.intersectObject(this.speechBubbleGroup, true);
            if (intersects.length > 0) {
                const dialogData = this.speechBubbleGroup.userData;
                this.showScreenSpeechBubble(dialogData.speaker, dialogData.text, dialogData.callback);
            }
        } catch (error) {
            console.warn("[AcademicScene2B] Error setting raycaster from camera:", error);
        }
    }

    createAlternativeButton(speaker, text, callback) {
        this.cleanupAlternativeButton();
        this.alternativeButton = document.createElement('div');
        this.alternativeButton.id = 'alternative-speech-button';
        
        const buttonStyle = `
            position: fixed; bottom: 20px; right: 20px; z-index: 10001; padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;
            border-radius: 30px; cursor: pointer; font-size: 14px; font-weight: 600;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;
        
        this.alternativeButton.innerHTML = `<button style="${buttonStyle}">💬 Baca Percakapan</button>`;
        document.body.appendChild(this.alternativeButton);
        
        const button = this.alternativeButton.querySelector('button');
        button.addEventListener('click', () => {
            // Play click sound for button
            if (this.experience.soundManager) {
                this.experience.soundManager.play('click', 0.6);
            }
            this.showScreenSpeechBubble(speaker, text, callback);
        });
        
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        });
    }

    showScreenSpeechBubble(speaker, text, callback) {
        this.cleanupScreenSpeechBubble();
        
        // TIDAK PERLU BACKDROP GELAP - Dialog muncul jelas tanpa overlay
        // Hapus backdrop untuk visibility yang lebih baik
        
        const screenBubble = document.createElement('div');
        screenBubble.id = 'screen-speech-bubble';
        screenBubble.style.cssText = `
            position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
            background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%); border: 3px solid #1976d2;
            padding: 30px 40px; border-radius: 20px; z-index: 10002; max-width: 700px; width: 85%;
            cursor: pointer; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25); animation: slideUp 0.4s ease;
            font-family: 'Segoe UI', Arial, sans-serif; backdrop-filter: blur(10px);
        `;
        
        screenBubble.innerHTML = `
            <div style="margin-bottom: 15px;">
                <h3 style="margin: 0; color: #1565c0; font-size: 22px; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                    👤 ${speaker}
                </h3>
            </div>
            <p style="margin: 15px 0; color: #212121; font-size: 16px; line-height: 1.6;">
                ${text}
            </p>
            <small style="color: #757575; font-size: 12px; font-style: italic;">
                💡 Klik untuk melanjutkan
            </small>
        `;
        
        const closeBubble = () => {
            screenBubble.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => {
                screenBubble.remove();
                this.cleanupSpeechBubble();
                if (callback) callback();
            }, 300);
        };
        
        screenBubble.addEventListener('click', closeBubble);
        
        document.body.appendChild(screenBubble);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
            @keyframes slideUp { from { transform: translate(-50%, -45%); opacity: 0; } to { transform: translate(-50%, -50%); opacity: 1; } }
            @keyframes slideDown { from { transform: translate(-50%, -50%); opacity: 1; } to { transform: translate(-50%, -45%); opacity: 0; } }
        `;
        if (!document.getElementById('speechBubbleAnimations')) {
            style.id = 'speechBubbleAnimations';
            document.head.appendChild(style);
        }
    }

    cleanupSpeechBubble() {
        // Stop any ongoing speech audio
        if (this.speechAudioManager) {
            this.speechAudioManager.stop();
        }
        
        if (this.speechBubbleGroup) {
            this.scene.remove(this.speechBubbleGroup);
            this.speechBubbleGroup = null;
        }
        this.cleanupAlternativeButton();
        this.cleanupScreenSpeechBubble();
    }

    cleanupAlternativeButton() {
        if (this.alternativeButton) {
            this.alternativeButton.remove();
            this.alternativeButton = null;
        }
    }

    cleanupScreenSpeechBubble() {
        const existingBubble = document.getElementById('screen-speech-bubble');
        if (existingBubble) {
            existingBubble.remove();
        }
    }

    // --- End Speech Bubble Logic ---

    showLoadingIndicator() {
        const existingLoader = document.getElementById('scene-loading-indicator');
        if (existingLoader) existingLoader.remove();
        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.id = 'scene-loading-indicator';
        this.loadingIndicator.style.pointerEvents = 'none';
        this.loadingIndicator.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.9); border: 3px solid rgba(255, 215, 0, 0.8); border-radius: 20px; padding: 40px; text-align: center; z-index: 10000001; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5); pointer-events: none;">
                <div style="color: #FFD700; font-size: 24px; font-weight: bold; margin-bottom: 20px; font-family: 'Gilroy', Arial, sans-serif;">Memuat Scene...</div>
                <div style="width: 300px; height: 8px; background: rgba(255, 255, 255, 0.2); border-radius: 10px; overflow: hidden; margin: 0 auto;">
                    <div id="loading-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #1E407C, #8B0000, #FFD700); border-radius: 10px; transition: width 0.3s ease; animation: pulse 1.5s ease-in-out infinite;"></div>
                </div>
                <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px; margin-top: 15px; font-family: 'Gilroy', Arial, sans-serif;">Mohon tunggu sebentar...</div>
            </div>
        `;
        if (!document.getElementById('scene-loading-pulse-animation')) {
            const style = document.createElement('style');
            style.id = 'scene-loading-pulse-animation';
            style.textContent = `@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }`;
            document.head.appendChild(style);
        }
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
        if (progressBar) progressBar.style.width = `${progress}%`;
    }

    async loadSceneAsync() {
        return new Promise((resolve, reject) => {
            try {
                this.updateLoadingProgress(20);
                this.setWorld();
                this.updateLoadingProgress(60);
                this.createNPC();
                this.updateLoadingProgress(80);
                this.ensurePlayerSpawned();
                this.updateLoadingProgress(100);
                resolve();
            } catch (error) {
                console.error("[AcademicScene2B] Error in loadSceneAsync:", error);
                reject(error);
            }
        });
    }

    ensurePlayerSpawned() {
        if (this.experience.world && this.experience.world.player) {
            const spawnPoint = this.experience.world.spawnPoints?.a_scene2b || new THREE.Vector3(0, 10, 0);
            console.log("[AcademicScene2B] Setting player spawn point to:", spawnPoint);
            this.experience.world.player.setSpawnPoint(spawnPoint);
        }
    }

    transitionToNextScene(sceneName) {
        console.log(`[AcademicScene2B] Loading scene: ${sceneName}`);
        
        // Hide dialog first
        this.dialogManager.hideAll();
        this.cleanupSpeechBubble();
        
        // Use World's switchSceneWithPosition to show loading bar
        if (this.experience.world && this.experience.world.switchSceneWithPosition) {
            const spawnPoint = this.experience.world.spawnPoints?.[sceneName] || new THREE.Vector3(0, 10, 0);
            console.log(`[AcademicScene2B] Switching to ${sceneName} at position:`, spawnPoint);
            this.experience.world.switchSceneWithPosition(sceneName, spawnPoint);
        } else {
            console.error("[AcademicScene2B] World.switchSceneWithPosition not available, falling back to reload");
            const newUrl = `${window.location.origin}${window.location.pathname}?scene=${sceneName}`;
            window.location.href = newUrl;
        }
    }

    update() {
        if (this.npcMixer) {
            this.npcMixer.update(this.experience.time.delta * 0.001);
        }
    }

    dispose() {
        console.log("[AcademicScene2B] Disposing...");
        this.cleanupSpeechBubble();
        if (this.loadingIndicator) this.hideLoadingIndicator();
        this.canvas.removeEventListener('click', this.onMouseClick.bind(this));
        this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));

        if (this.dialogManager) {
            this.dialogManager.hideAll();
        }
        if (this.classModel && this.classModel.parent) {
            this.scene.remove(this.classModel.parent);
        }
        if (this.npcDeskmate) {
            this.scene.remove(this.npcDeskmate);
        }
        if (this.npcMixer) {
            this.npcMixer.stopAllAction();
        }
    }
}