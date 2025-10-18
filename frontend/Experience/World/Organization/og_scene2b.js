import Experience from "../../Experience.js";
import * as THREE from "three";
import Portal from "../Portal.js";

export default class OrganizationScene2B {
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

        // Load the organization model (ruangan_osis.glb)
        this.organizationModel = this.resources.items.organization.scene;
        this.organizationModel.position.set(0, 0, 0);
        this.organizationModel.rotation.set(0, 0, 0);
        this.organizationModel.scale.set(5, 5, 5);
        collidableGroup.add(this.organizationModel);

        // Setup collider for physics
        this.collider = this.resources.items.collider.scene;
        this.collider.position.set(0, 0, 0);
        this.collider.rotation.set(0, 0, 0);
        this.collider.scale.set(5, 5, 5);

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

        console.log("Organization Scene 2B loaded with full collision enabled.");
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
        console.log("[OrganizationScene2B] Disposing Organization Scene 2B...");

        // Hapus portal
        if (this.westgatePortal) {
            this.westgatePortal.dispose();
            this.westgatePortal = null;
        }

        // Hapus model dari scene
        if (this.organizationModel && this.organizationModel.parent) {
            this.scene.remove(this.organizationModel.parent);
        }

        console.log("[OrganizationScene2B] Organization Scene 2B disposed");
    }
}
