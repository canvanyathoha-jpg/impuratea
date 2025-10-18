import Experience from "../../Experience.js";
import * as THREE from "three";
import Portal from "../Portal.js";

export default class OrganizationScene4B {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.setWorld();
        this.createPortals();
    }

    setWorld() {
        // Create a group for all collidable objects
        const collidableGroup = new THREE.Group();

        // Load the RuangGuru model (Ruang_Guru.glb)
        this.ruangGuruModel = this.resources.items.ruangguru.scene;
        this.ruangGuruModel.position.set(0, 0, 0);
        this.ruangGuruModel.rotation.set(0, 0, 0);
        this.ruangGuruModel.scale.set(12, 12, 12);
        collidableGroup.add(this.ruangGuruModel);

        // Setup collider for physics
        this.collider = this.resources.items.collider.scene;
        this.collider.position.set(0, 0, 0);
        this.collider.rotation.set(0, 0, 0);
        this.collider.scale.set(12, 12, 12); // Match RuangGuru model scale

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

        console.log("Organization Scene 4B (RuangGuru) loaded with full collision enabled.");
    }

    createPortals() {
        // Portal ke Westgate atau scene lain (sesuaikan posisi dengan lokasi pintu)
        this.westgatePortal = new Portal(
            new THREE.Vector3(49, 2, 30), // Posisi portal (sesuaikan dengan pintu OSIS)
            "westgate", // Target scene
            new THREE.Vector3(0, 10, 0), // Posisi spawn di scene baru
            "Westgate" // Nama ruangan
        );
    }

    update() {
        // Update portal animation
        if (this.westgatePortal) {
            this.westgatePortal.update();
        }
    }

    dispose() {
        console.log("[OrganizationScene4B] Disposing Organization Scene 4B (RuangGuru)...");

        // Hapus portal
        if (this.westgatePortal) {
            this.westgatePortal.dispose();
            this.westgatePortal = null;
        }

        // Hapus model dari scene
        if (this.ruangGuruModel && this.ruangGuruModel.parent) {
            this.scene.remove(this.ruangGuruModel.parent);
        }

        console.log("[OrganizationScene4B] Organization Scene 4B (RuangGuru) disposed");
    }
}
