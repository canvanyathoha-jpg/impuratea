import * as THREE from "three";
import Experience from "../Experience.js";

export default class Portal {
    constructor(position, targetScene, targetPosition, promptText = "Lab") {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.camera = this.experience.camera;
        this.player = this.experience.world.player;
        
        this.position = position;
        this.targetScene = targetScene;
        this.targetPosition = targetPosition;
        this.promptText = promptText;
        
        this.isPlayerNear = false;
        this.activationRadius = 2;
        
        this.createPortalVisual();
        this.createUI();
    }
    
    createPortalVisual() {
        // Buat lingkaran yang bersinar (diperbesar dari 1.5 ke 3.0)
        const geometry = new THREE.CircleGeometry(3.0, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });

        this.portalMesh = new THREE.Mesh(geometry, material);
        this.portalMesh.rotation.x = -Math.PI / 2; // Rotasi horizontal
        this.portalMesh.position.copy(this.position);
        // Tidak override position.y, biarkan mengikuti this.position

        this.scene.add(this.portalMesh);

        // Tambahkan ring luar yang berputar (diperbesar dari 1.5-1.8 ke 3.0-3.5)
        const ringGeometry = new THREE.RingGeometry(3.0, 3.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        this.ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        this.ringMesh.rotation.x = -Math.PI / 2;
        this.ringMesh.position.copy(this.position);
        this.ringMesh.position.y += 0.01; // Sedikit di atas portalMesh untuk efek layer

        this.scene.add(this.ringMesh);

        // Tambahkan partikel cahaya
        this.createParticles();
    }
    
    createParticles() {
        const particleCount = 50;
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 3.0; // Diperbesar dari 1.5 ke 3.0

            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.random() * 2;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
        }
        
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.particles.position.copy(this.position);
        
        this.scene.add(this.particles);
    }
    
    createUI() {
        // Buat dialog konfirmasi
        this.promptDiv = document.createElement('div');
        this.promptDiv.id = 'portal-prompt';
        this.promptDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            padding: 30px 40px;
            border-radius: 15px;
            border: 2px solid #00ffff;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
            display: none;
            z-index: 1000;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        `;
        
        this.promptDiv.innerHTML = `
            <h2 style="margin: 0 0 20px 0; color: #00ffff;">Teleportasi</h2>
            <p style="margin: 0 0 25px 0; font-size: 18px;">Apakah Anda ingin berpindah ke ${this.promptText}?</p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="portal-yes" style="
                    padding: 12px 30px;
                    background: #00ffff;
                    border: none;
                    border-radius: 8px;
                    color: black;
                    font-weight: bold;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s;
                ">Ya</button>
                <button id="portal-no" style="
                    padding: 12px 30px;
                    background: #ff4444;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-weight: bold;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s;
                ">Tidak</button>
            </div>
        `;
        
        document.body.appendChild(this.promptDiv);
        
        // Event listeners untuk tombol
        document.getElementById('portal-yes').addEventListener('click', () => {
            this.teleport();
        });
        
        document.getElementById('portal-no').addEventListener('click', () => {
            this.hidePrompt();
        });
        
        // Tambahkan hover effects
        const style = document.createElement('style');
        style.textContent = `
            #portal-yes:hover { transform: scale(1.1); background: #00cccc; }
            #portal-no:hover { transform: scale(1.1); background: #cc0000; }
        `;
        document.head.appendChild(style);
    }
    
    showPrompt() {
        this.promptDiv.style.display = 'block';
        // Pause game jika perlu
        document.body.style.cursor = 'default';
    }
    
    hidePrompt() {
        this.promptDiv.style.display = 'none';
        document.body.style.cursor = 'none';
    }
    
    checkPlayerProximity() {
        if (!this.player || !this.player.avatar || !this.player.avatar.avatar) return;

        const playerPos = this.player.avatar.avatar.position;
        const distance = playerPos.distanceTo(this.position);

        if (distance < this.activationRadius && !this.isPlayerNear) {
            this.isPlayerNear = true;
            this.showPrompt();
        } else if (distance >= this.activationRadius && this.isPlayerNear) {
            this.isPlayerNear = false;
            this.hidePrompt();
        }
    }
    
    teleport() {
        console.log(`Teleporting to ${this.targetScene}`);
        
        // Fade effect
        const fadeDiv = document.createElement('div');
        fadeDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.5s;
            pointer-events: none;
        `;
        document.body.appendChild(fadeDiv);
        
        setTimeout(() => {
            fadeDiv.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            // Load scene baru atau pindahkan player
            this.loadNewScene();
        }, 500);
    }
    
    loadNewScene() {
        console.log("Loading new scene:", this.targetScene);

        // Gunakan sistem scene switching yang sudah ada
        if (this.experience.world && this.experience.world.switchSceneWithPosition) {
            this.experience.world.switchSceneWithPosition(this.targetScene, this.targetPosition);
        } else {
            console.error("World.switchSceneWithPosition not found!");
        }

        this.hidePrompt();
    }
    
    update() {
        // Animasi portal
        if (this.portalMesh) {
            this.portalMesh.material.opacity = 0.6 + Math.sin(Date.now() * 0.003) * 0.2;
        }
        
        if (this.ringMesh) {
            this.ringMesh.rotation.z += 0.01;
        }
        
        if (this.particles) {
            this.particles.rotation.y += 0.005;
            
            // Animasi partikel naik
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] += 0.01;
                if (positions[i] > 2) {
                    positions[i] = 0;
                }
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
        
        // Check player proximity
        this.checkPlayerProximity();
    }
    
    dispose() {
        this.scene.remove(this.portalMesh);
        this.scene.remove(this.ringMesh);
        this.scene.remove(this.particles);
        this.promptDiv.remove();
    }
}