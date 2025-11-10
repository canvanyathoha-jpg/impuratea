import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import Nametag from "./Nametag.js";

export default class Avatar {
    constructor(avatar, scene, name = "Anonymous", id, avatarType = null) {
        this.scene = scene;
        this.name = new Nametag();
        this.nametag = this.name.createNametag(16, 150, name);
        this.avatar = SkeletonUtils.clone(avatar.scene);
        this.avatar.userData.id = id;
        this.avatarType = avatarType;

        this.avatar.animations = avatar.animations.map((clip) => {
            return clip.clone();
        });

        // Normalise initial transform so the character always appears in front of the player
        this.avatar.position.set(0, 0, 0);
        this.avatar.rotation.set(0, 0, 0);
        this.avatar.scale.set(1, 1, 1);

        // Compute initial bounds
        const initialBox = new THREE.Box3().setFromObject(this.avatar);
        const initialSize = initialBox.getSize(new THREE.Vector3());

        // Scale the avatar to match legacy height
        // Female character needs bigger scale to match male size
        let targetHeight = 3.3;
        if (this.avatarType === "female") {
            targetHeight = 4.2; // Increased from 3.3 to 4.2 to match male size
        }

        const scaleFactor = targetHeight / (initialSize.y || 1);
        this.avatar.scale.setScalar(scaleFactor);

        // Recompute bounds after scaling
        const scaledBox = new THREE.Box3().setFromObject(this.avatar);
        const scaledSize = scaledBox.getSize(new THREE.Vector3());
        const { min, max } = scaledBox;

        // Centre X/Z and align feet to ground (y = 0)
        this.avatar.position.x -= (min.x + max.x) / 2;
        this.avatar.position.z -= (min.z + max.z) / 2;
        this.avatar.position.y -= min.y;

        // Store useful metrics for caller (Player.js)
        this.height = scaledSize.y;
        this.width = scaledSize.x;
        this.depth = scaledSize.z;
        this.groundOffset = 6.2; // Legacy offset used throughout Player.js

        // Capture ONLY the main Hip/Hips bone to lock root motion
        // Other bones (arms, legs, etc.) should animate freely
        this.rootBone = null;
        this.avatar.traverse((child) => {
            if (child.isBone && !this.rootBone) {
                const boneName = child.name.toLowerCase();
                // Look for the main hip/root bone
                if (boneName.includes('hip') || boneName.includes('root') || boneName === 'mixamorig:hips') {
                    this.rootBone = {
                        bone: child,
                        initialPosition: child.position.clone(),
                    };
                }
            }
        });

        this.setAvatar();
    }

    setAvatar() {
        this.speedAdjustment = 1;

        // Ensure materials are visible from all angles and not culled accidentally
        this.avatar.traverse((child) => {
            if (child.isMesh) {
                child.frustumCulled = false;
                if (child.material) {
                    child.material.side = THREE.DoubleSide;
                }
            }
        });

        this.setAnimation();
        this.scene.add(this.avatar);

        if (this.avatar.userData.id) {
            this.scene.add(this.nametag);
        }
    }

    setAnimation() {
        this.animation = {};

        this.animation.mixer = new THREE.AnimationMixer(this.avatar);
        this.animation.actions = {};

        const availableClips = Array.isArray(this.avatar.animations)
            ? this.avatar.animations
            : [];

        const findClip = (preferredNames = [], fallbackIndex = 0) => {
            if (availableClips.length === 0) {
                return null;
            }

            for (const name of preferredNames) {
                const lowerName = name.toLowerCase();
                const match = availableClips.find((clip) => {
                    if (!clip.name) return false;
                    const clipName = clip.name.toLowerCase();
                    return (
                        clipName === lowerName ||
                        clipName.includes(lowerName) ||
                        lowerName.includes(clipName)
                    );
                });
                if (match) {
                    return match;
                }
            }

            if (fallbackIndex >= 0 && fallbackIndex < availableClips.length) {
                return availableClips[fallbackIndex];
            }

        };

        const registerAction = (key, preferredNames, fallbackIndex) => {
            const clip = findClip(preferredNames, fallbackIndex);
            if (!clip) {
                console.warn(`[Avatar] Animation clip not found for ${key}`, preferredNames);
                return null;
            }

            const action = this.animation.mixer.clipAction(clip);
            this.animation.actions[key] = action;
            if (!this.animation.actions.current) {
                this.animation.actions.current = action;
                action.play();
            }
            return action;
        };

        registerAction("idle", ["idle", "standing", "rest", "breath"], 0);
        registerAction("walking", ["walk", "walking", "stride"], 1);
        registerAction("running", ["run", "running", "sprint"], 2);
        registerAction("jumping", ["jump", "jumping"], 3);
        registerAction("waving", ["wave", "waving"], 4);
        registerAction("dancing", ["dance", "dancing"], 5);

        if (!this.animation.actions.current) {
            const firstClip = availableClips[0];
            if (firstClip) {
                const fallbackAction = this.animation.mixer.clipAction(firstClip);
                this.animation.actions.current = fallbackAction;
                fallbackAction.play();
            }
        }

        this.animation.play = (name) => {
            const newAction = this.animation.actions[name];
            const oldAction = this.animation.actions.current;

            if (!newAction || oldAction === newAction) {
                return;
            }

            if (this.animation.actions.current === "jumping") {
                this.speedAdjustment = 1.5;
            } else {
                this.speedAdjustment = 1.0;
            }

            newAction.reset();
            newAction.play();
            if (oldAction) {
                newAction.crossFadeFrom(oldAction, 0.2);
            }

            this.animation.actions.current = newAction;
        };

        this.animation.update = (time) => {
            if (this.animation.mixer) {
                this.animation.mixer.update(time * this.speedAdjustment);
            }

            // Lock ONLY the main root bone X/Z translation to prevent locomotion
            // Allow Y movement for jumping and all other bone movements
            if (this.rootBone) {
                this.rootBone.bone.position.x = this.rootBone.initialPosition.x;
                this.rootBone.bone.position.z = this.rootBone.initialPosition.z;
                // Don't lock Y to allow vertical animations like jumping
            }
        };
    }
}
