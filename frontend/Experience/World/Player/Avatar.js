import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import Nametag from "./Nametag.js";

export default class Avatar {
    constructor(avatar, scene, name = "Anonymous", id, avatarType = null) {
        console.log(`[Avatar] Creating avatar with type: ${avatarType}`);
        console.log(`[Avatar] Avatar data:`, {
            hasScene: !!avatar?.scene,
            hasAnimations: !!avatar?.animations,
            animationCount: avatar?.animations?.length || 0
        });
        
        if (!avatar || !avatar.scene) {
            console.error(`[Avatar] ❌ Invalid avatar data provided!`);
            throw new Error('Invalid avatar data: scene is missing');
        }
        
        this.scene = scene;
        this.name = new Nametag();
        this.nametag = this.name.createNametag(16, 150, name);
        
        try {
            this.avatar = SkeletonUtils.clone(avatar.scene);
            console.log(`[Avatar] ✅ Avatar cloned successfully`);
        } catch (error) {
            console.error(`[Avatar] ❌ Error cloning avatar:`, error);
            throw error;
        }
        
        this.avatar.userData.id = id;
        this.avatarType = avatarType;

        if (avatar.animations && Array.isArray(avatar.animations)) {
            this.avatar.animations = avatar.animations.map((clip) => {
                return clip.clone();
            });
            console.log(`[Avatar] ✅ Cloned ${this.avatar.animations.length} animations`);
        } else {
            console.warn(`[Avatar] ⚠️ No animations found in avatar data`);
            this.avatar.animations = [];
        }

        // Normalise initial transform so the character always appears in front of the player
        this.avatar.position.set(0, 0, 0);
        this.avatar.rotation.set(0, 0, 0);
        this.avatar.scale.set(1, 1, 1);

        // Compute initial bounds to get model's natural size
        const initialBox = new THREE.Box3().setFromObject(this.avatar);
        const initialSize = initialBox.getSize(new THREE.Vector3());

        // Scale the avatar based on character type
        // Different scaling approach for female vs male characters
        let scaleFactor;
        
        if (this.avatarType === "female") {
            // Female character: Use target height to control character size
            // Increase femaleTargetHeight to make female character bigger
            // Default: 0.16 (very small), try 0.2-0.3 for slightly bigger, 0.5+ for much bigger
            const femaleTargetHeight = 5.5; // Increased from 0.16 to make female character bigger (3x the original)
            scaleFactor = femaleTargetHeight / (initialSize.y || 1);
        } else {
            // Male/default character: Use standard targetHeight approach
            // Increase targetHeight to make male character bigger
            // Default: 1, try 1.2-1.5 for slightly bigger, 2.0 for much bigger
            const targetHeight = 3; // Increased from 1 to make male character bigger
            scaleFactor = targetHeight / (initialSize.y || 1);
        }
        
        // Apply the calculated scale
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
        console.log(`[Avatar] ✅ Avatar setup complete. Visible: ${this.avatar.visible}, Position:`, this.avatar.position);
    }

    setAvatar() {
        console.log(`[Avatar] Setting up avatar in scene...`);
        this.speedAdjustment = 1;

        // OPTIMIZATION: Enable frustum culling for better performance
        // Only disable for very important objects that must always be visible
        let meshCount = 0;
        this.avatar.traverse((child) => {
            if (child.isMesh) {
                meshCount++;
                child.frustumCulled = true; // OPTIMIZATION: Enable frustum culling
                // OPTIMIZATION: Disable shadows for better performance
                child.castShadow = false;
                child.receiveShadow = false;
                if (child.material) {
                    child.material.side = THREE.DoubleSide;
                }
            }
        });
        console.log(`[Avatar] Found ${meshCount} meshes in avatar`);

        this.setAnimation();
        
        // Ensure avatar is visible before adding to scene
        this.avatar.visible = true;
        this.scene.add(this.avatar);
        console.log(`[Avatar] ✅ Avatar added to scene. Visible: ${this.avatar.visible}, In scene:`, this.scene.children.includes(this.avatar));

        if (this.avatar.userData.id) {
            this.scene.add(this.nametag);
            console.log(`[Avatar] ✅ Nametag added to scene`);
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
