import Experience from "../Experience.js";
import * as THREE from "three";

export default class Class {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.octree = this.experience.world.octree;

        this.setWorld();
    }

    setWorld() {
        // Load the class model (Kelas-C.glb)
        this.classModel = this.resources.items.class.scene;

        // Set class position far forward (600 units ahead)
        this.classModel.position.set(0, 5, -600);
        this.classModel.rotation.set(0, 0, 0);
        this.classModel.scale.set(10, 10, 10); // Same scale as school

        // Setup collider for physics (using the original optimized collider.glb)
        this.collider = this.resources.items.collider.scene;
        this.collider.position.set(0, 5, -600);
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

        // Create ground plane near class building
        const classGroundGeometry = new THREE.BoxGeometry(1000, 1, 1000);
        const classGroundMaterial = new THREE.MeshBasicMaterial({
            color: 0x0000ff,
            transparent: true,
            opacity: 0
        });
        this.classGround = new THREE.Mesh(classGroundGeometry, classGroundMaterial);
        this.classGround.position.set(0, 8, -600); // Ground near class building
        this.classGround.visible = false;

        // Add both grounds to octree
        this.octree.fromGraphNode(this.spawnGround);
        this.octree.fromGraphNode(this.classGround);

        // Add the class model and grounds to the scene
        this.scene.add(this.classModel);
        this.scene.add(this.spawnGround);
        this.scene.add(this.classGround);

        console.log("Class scene loaded");
        console.log("Class building position:", this.classModel.position);
        console.log("Class building scale:", this.classModel.scale);
        console.log("Collider position:", this.collider.position);
        console.log("Collider scale:", this.collider.scale);
    }
}
