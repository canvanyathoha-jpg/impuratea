import Experience from "../Experience.js";
import * as THREE from "three";

export default class Organization {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.setWorld();
    }

    setWorld() {
        // Load the organization model (OSIS-C.glb)
        this.organizationModel = this.resources.items.organization.scene;

        // Set organization position far ahead and slightly elevated (same as school)
        this.organizationModel.position.set(0, 5, -500);
        this.organizationModel.rotation.set(0, 0, 0);
        this.organizationModel.scale.set(10, 10, 10); // Same scale as school and class

        // Setup collider for physics (using the original optimized collider.glb)
        this.collider = this.resources.items.collider.scene;
        this.collider.position.set(0, 5, -500);
        this.collider.rotation.set(0, 0, 0);
        this.collider.scale.set(10, 10, 10);

        // Make collider invisible
        this.collider.traverse((child) => {
            if (child.isMesh) {
                child.visible = false;
            }
        });

        // Add collider to octree
        this.octree.fromGraphNode(this.collider);

        // Create ground plane at spawn area
        const spawnGroundGeometry = new THREE.BoxGeometry(500, 1, 500);
        const spawnGroundMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0
        });
        this.spawnGround = new THREE.Mesh(spawnGroundGeometry, spawnGroundMaterial);
        this.spawnGround.position.set(0, 8, 0); // Ground at spawn point
        this.spawnGround.visible = false;

        // Create ground plane near organization building
        const organizationGroundGeometry = new THREE.BoxGeometry(1000, 1, 1000);
        const organizationGroundMaterial = new THREE.MeshBasicMaterial({
            color: 0x0000ff,
            transparent: true,
            opacity: 0
        });
        this.organizationGround = new THREE.Mesh(organizationGroundGeometry, organizationGroundMaterial);
        this.organizationGround.position.set(0, 8, -500); // Ground near organization building
        this.organizationGround.visible = false;

        // Add both grounds to octree
        this.octree.fromGraphNode(this.spawnGround);
        this.octree.fromGraphNode(this.organizationGround);

        // Add the organization model and grounds to the scene
        this.scene.add(this.organizationModel);
        this.scene.add(this.spawnGround);
        this.scene.add(this.organizationGround);

        console.log("Organization scene loaded");
        console.log("Organization building position:", this.organizationModel.position);
        console.log("Organization building scale:", this.organizationModel.scale);
        console.log("Collider position:", this.collider.position);
        console.log("Collider scale:", this.collider.scale);
    }
}
