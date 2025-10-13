import * as THREE from "three";
import Experience from "./Experience.js";
import { OrbitControls } from "../Experience/Utils/CustomOrbitControls.js";

export default class Camera {
    constructor() {
        this.experience = new Experience();
        this.sizes = this.experience.sizes;
        this.scene = this.experience.scene;
        this.canvas = this.experience.canvas;
        this.params = {
            fov: 75,
            aspect: this.sizes.aspect,
            near: 0.001,
            far: 1000,
        };
        this.controls = null;

        this.setPerspectiveCamera();
        this.setOrbitControls();
    }

    setPerspectiveCamera() {
        this.perspectiveCamera = new THREE.PerspectiveCamera(
            this.params.fov,
            this.params.aspect,
            this.params.near,
            this.params.far
        );

        this.perspectiveCamera.position.set(17.8838, 1.2 + 10, -3.72508);
        this.perspectiveCamera.rotation.y = Math.PI / 2;

        this.scene.add(this.perspectiveCamera);
    }

    setOrbitControls() {
        this.controls = new OrbitControls(this.perspectiveCamera, this.canvas);
        this.controls.enabled = true; // Ensure controls are enabled
        this.controls.enableDamping = true;
        this.controls.enableZoom = true; // Enable zoom with mouse wheel
        this.controls.enableRotate = true; // Enable rotation with left click
        this.controls.enablePan = true; // Enable pan with right click or middle mouse
        // this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 50; // Increased from 6 to 50 for more zoom out range

        this.controls.dampingFactor = 0.1;

        console.log('[Camera] OrbitControls initialized:', {
            enabled: this.controls.enabled,
            enableZoom: this.controls.enableZoom,
            enableRotate: this.controls.enableRotate,
            enablePan: this.controls.enablePan
        });
    }

    enableOrbitControls() {
        this.controls.enabled = true;
    }

    disableOrbitControls() {
        this.controls.enabled = false;
    }

    onResize() {
        this.perspectiveCamera.aspect = this.sizes.aspect;
        this.perspectiveCamera.updateProjectionMatrix();
    }

    update() {
        if (!this.controls) return;
        if (this.controls.enabled === true) {
            this.controls.update();
        }
    }
}
