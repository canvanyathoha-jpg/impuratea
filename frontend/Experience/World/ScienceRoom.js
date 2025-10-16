import Experience from "../Experience.js";
import * as THREE from "three";
import Portal from "./Portal.js";

export default class ScienceRoom {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.setWorld();
        this.createPortals();
    }

    setWorld() {
        const collidableGroup = new THREE.Group();

        this.model = this.resources.items["science-room"].scene;
        this.model.position.set(0, 0, 0);
        this.model.rotation.set(0, 0, 0);
        this.model.scale.set(10, 10, 10);
        collidableGroup.add(this.model);

        this.collider = this.resources.items.collider.scene.clone(); // Clone to avoid conflicts
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

        console.log("Science Room scene loaded with full collision enabled.");
    }

    createPortals() {
        // Portal kembali ke Kelas
        this.classPortal = new Portal(
            new THREE.Vector3(0, 0.1, 5), // Sesuaikan posisi ini
            "class",
            new THREE.Vector3(0, 0, 14), // Spawn di depan portal kelas
            "Kelas"
        );
    }

    update() {
        if (this.classPortal) {
            this.classPortal.update();
        }
    }

    dispose() {
        // Hapus model dari scene
        if (this.model) {
            this.scene.remove(this.model.parent); // Hapus group
        }

        // Hapus portal
        if (this.classPortal) {
            this.classPortal.dispose();
        }
        
        console.log("ScienceRoom disposed");
    }
}