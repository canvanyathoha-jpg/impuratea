import Experience from "../Experience.js";
import * as THREE from "three";

export default class Westgate {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.setWorld();
    }

    setWorld() {
        // Load the main school model
        this.school = this.resources.items.school.scene;

        // Set school position far ahead and slightly elevated
        // Player spawns at (0, 10, 0), school is moved forward
        this.school.position.set(0, 5, -500); // At Y=5, 500 units forward
        this.school.rotation.set(0, 0, 0);
        this.school.scale.set(10, 10, 10); // Make school HUGE (10x bigger)

        // Setup collider for physics (using the original optimized collider.glb)
        this.collider = this.resources.items.collider.scene;
        this.collider.position.set(0, 0, 0);
        this.collider.rotation.set(0, 0, 0);
        this.collider.scale.set(1, 1, 1);

        // Make collider invisible
        this.collider.traverse((child) => {
            if (child.isMesh) {
                child.visible = false;
            }
        });

        // Add collider to octree
        this.octree.fromGraphNode(this.collider);

        // Create additional ground plane for player spawn area
        const groundGeometry = new THREE.BoxGeometry(500, 1, 500);
        const groundMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.position.set(0, 8, 0); // Ground at Y=8, player spawns at Y=10
        this.ground.visible = false;

        // Add ground to octree as well
        this.octree.fromGraphNode(this.ground);

        // Add the school model and ground to the scene
        this.scene.add(this.school);
        this.scene.add(this.ground);
    }
}
