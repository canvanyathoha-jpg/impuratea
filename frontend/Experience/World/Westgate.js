import Experience from "../Experience.js";
import * as THREE from "three";
import Portal from "./Portal.js";
import NPC from "./NPC.js";
import NPCPair from "./NPCPair.js";

export default class Westgate {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.npcs = [];
        this.npcPairs = [];

        this.setWorld();
        this.createPortals();
        this.createNPCs();
    }

    setWorld() {
        // Create a group for all collidable objects
        const collidableGroup = new THREE.Group();

        // Load the school model (schooll.glb)
        this.schoolModel = this.resources.items.school.scene;
        this.schoolModel.position.set(0, 0, 0);
        this.schoolModel.rotation.set(0, 0, 0);
        this.schoolModel.scale.set(10, 10, 10);
        collidableGroup.add(this.schoolModel);

        // Setup collider for physics
        this.collider = this.resources.items.collider.scene;
        this.collider.position.set(0, 0, 0);
        this.collider.rotation.set(0, 0, 0);
        this.collider.scale.set(10, 10, 10);

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

        // Set collision objects for camera - CRITICAL for proper movement!
        if (this.experience.camera && this.experience.camera.controls) {
            this.experience.camera.controls.collisionObjects = this.collider;
            console.log("[Westgate] Camera collision objects set");
        }

        console.log("Westgate scene loaded with full collision enabled.");
    }

    createPortals() {
        // Portal ke Academic Scene 1 (sesuaikan posisi dengan lokasi pintu)
        this.academicPortal = new Portal(
            new THREE.Vector3(49, 2, 30), // Posisi portal (sesuaikan dengan pintu)
            "a_scene1", // Target scene
            new THREE.Vector3(0, 10, 0), // Posisi spawn di scene baru
            "Academic Scene 1" // Nama ruangan
        );
    }

    createNPCs() {
        console.log("[Westgate] Creating NPCs with conversation pairs...");

        // Main character spawns at (0, 10, 0), so place NPCs around but not too close

        // ========== PAIR 1: Sarah & Budi - Walking and chatting on the right side ==========
        const pair1 = new NPCPair({
            distance: 3.5, // Distance between NPCs
            walkTogether: true,
            pauseInterval: 12000, // Pause every 12 seconds
            pauseDuration: 6000, // Chat for 6 seconds
            npc1: {
                name: "Sarah",
                gender: "female",
                position: new THREE.Vector3(15, 0, 8),
                initialRotation: 90,
                waypoints: [
                    new THREE.Vector3(15, 0, 8),
                    new THREE.Vector3(25, 0, 8),
                    new THREE.Vector3(25, 0, 12),
                    new THREE.Vector3(15, 0, 12)
                ],
                walkSpeed: 1.5
            },
            npc2: {
                name: "Budi",
                gender: "male",
                initialRotation: 90,
                walkSpeed: 1.5
            },
            conversation: [
                { speaker: 1, text: "Eh, kamu udah lihat pengumuman besok?" },
                { speaker: 2, text: "Belum nih, ada apa emang?" },
                { speaker: 1, text: "Ada seminar tentang AI katanya!" },
                { speaker: 2, text: "Wah menarik, jam berapa?" },
                { speaker: 1, text: "Jam 2 siang, di auditorium" },
                { speaker: 2, text: "Oke deh, ikut yuk!" }
            ]
        });
        this.npcPairs.push(pair1);

        // ========== PAIR 2: Rina & Andi - Walking and chatting on the left side ==========
        const pair2 = new NPCPair({
            distance: 3.5,
            walkTogether: true,
            pauseInterval: 15000,
            pauseDuration: 7000,
            npc1: {
                name: "Rina",
                gender: "female",
                position: new THREE.Vector3(-15, 0, 8),
                initialRotation: -90,
                waypoints: [
                    new THREE.Vector3(-15, 0, 8),
                    new THREE.Vector3(-25, 0, 8),
                    new THREE.Vector3(-25, 0, 12),
                    new THREE.Vector3(-15, 0, 12)
                ],
                walkSpeed: 1.6
            },
            npc2: {
                name: "Andi",
                gender: "male",
                initialRotation: -90,
                walkSpeed: 1.6
            },
            conversation: [
                { speaker: 2, text: "Tugas kelompok udah selesai belum?" },
                { speaker: 1, text: "Hampir nih, tinggal presentasinya" },
                { speaker: 2, text: "Kapan presentasinya?" },
                { speaker: 1, text: "Minggu depan, udah siap belum kamu?" },
                { speaker: 2, text: "Masih perlu latihan sih hehe" },
                { speaker: 1, text: "Yuk nanti latihan bareng!" }
            ]
        });
        this.npcPairs.push(pair2);

        // ========== PAIR 3: Siti & Rudi - Walking behind ==========
        const pair3 = new NPCPair({
            distance: 3.5,
            walkTogether: true,
            pauseInterval: 10000,
            pauseDuration: 5000,
            npc1: {
                name: "Siti",
                gender: "female",
                position: new THREE.Vector3(12, 0, 0),
                initialRotation: 90,
                waypoints: [
                    new THREE.Vector3(12, 0, 0),
                    new THREE.Vector3(22, 0, 0),
                    new THREE.Vector3(22, 0, 5),
                    new THREE.Vector3(12, 0, 5)
                ],
                walkSpeed: 1.4
            },
            npc2: {
                name: "Rudi",
                gender: "male",
                initialRotation: 90,
                walkSpeed: 1.4
            },
            conversation: [
                { speaker: 1, text: "Udah makan siang belum?" },
                { speaker: 2, text: "Belum nih, kamu?" },
                { speaker: 1, text: "Aku juga belum, yuk ke kantin" },
                { speaker: 2, text: "Boleh! Ada menu baru gak ya?" },
                { speaker: 1, text: "Kata temen ada nasi goreng spesial" },
                { speaker: 2, text: "Oke gas kesana!" }
            ]
        });
        this.npcPairs.push(pair3);

        // ========== SOLO NPC: Dewi - Walking alone in front ==========
        const soloNPC1 = new NPC({
            name: "Dewi",
            gender: "female",
            position: new THREE.Vector3(-12, 0, 15),
            initialRotation: -90,
            waypoints: [
                new THREE.Vector3(-12, 0, 15),
                new THREE.Vector3(-22, 0, 15),
                new THREE.Vector3(-22, 0, 20),
                new THREE.Vector3(-12, 0, 20)
            ],
            walkSpeed: 1.8,
            dialogues: [
                "Hmm... perpustakaan dimana ya?",
                "Wah cuaca bagus hari ini",
                "Semangat kuliahnya!",
                "Ngantuk banget nih..."
            ],
            chatInterval: 8000
        });
        this.npcs.push(soloNPC1);

        // ========== SOLO NPC: Fajar - Walking alone in front right ==========
        const soloNPC2 = new NPC({
            name: "Fajar",
            gender: "male",
            position: new THREE.Vector3(18, 0, 15),
            initialRotation: 90,
            waypoints: [
                new THREE.Vector3(18, 0, 15),
                new THREE.Vector3(28, 0, 15),
                new THREE.Vector3(28, 0, 20),
                new THREE.Vector3(18, 0, 20)
            ],
            walkSpeed: 2,
            dialogues: [
                "Sip, tinggal satu mata kuliah lagi",
                "Wifi kenceng nih disini",
                "Capek deh hari ini",
                "Besok libur kan ya?"
            ],
            chatInterval: 10000
        });
        this.npcs.push(soloNPC2);

        console.log(`[Westgate] Created ${this.npcPairs.length} NPC pairs and ${this.npcs.length} solo NPCs`);

        // Start NPCs movement after a short delay
        setTimeout(() => {
            // Start solo NPCs
            this.npcs.forEach(npc => {
                if (npc.waypoints.length > 0) {
                    npc.moveTo(npc.waypoints[0]);
                }
            });

            // Start paired NPCs
            this.npcPairs.forEach(pair => {
                if (pair.npc1.waypoints.length > 0) {
                    pair.npc1.moveTo(pair.npc1.waypoints[0]);
                }
                if (pair.npc2.waypoints.length > 0) {
                    pair.npc2.moveTo(pair.npc2.waypoints[0]);
                }
            });
        }, 1000);
    }

    update() {
        // Update portal animation
        if (this.academicPortal) {
            this.academicPortal.update();
        }

        // Update solo NPCs
        if (this.npcs && this.npcs.length > 0) {
            this.npcs.forEach(npc => {
                npc.update();
            });
        }

        // Update NPC pairs
        if (this.npcPairs && this.npcPairs.length > 0) {
            this.npcPairs.forEach(pair => {
                pair.update();
            });
        }
    }

    dispose() {
        console.log("[Westgate] Disposing Westgate scene...");

        // Hapus portal
        if (this.academicPortal) {
            this.academicPortal.dispose();
            this.academicPortal = null;
        }

        // Hapus solo NPCs
        if (this.npcs && this.npcs.length > 0) {
            this.npcs.forEach(npc => {
                npc.dispose();
            });
            this.npcs = [];
        }

        // Hapus NPC pairs
        if (this.npcPairs && this.npcPairs.length > 0) {
            this.npcPairs.forEach(pair => {
                pair.dispose();
            });
            this.npcPairs = [];
        }

        // Hapus model dari scene
        if (this.schoolModel && this.schoolModel.parent) {
            this.scene.remove(this.schoolModel.parent);
        }

        console.log("[Westgate] Westgate scene disposed");
    }
}
