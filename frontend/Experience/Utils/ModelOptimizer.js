/**
 * ModelOptimizer.js
 * Utility functions to optimize 3D models for better performance
 * Applies optimizations like disabling shadows, enabling frustum culling, etc.
 */

import * as THREE from "three";

export default class ModelOptimizer {
    /**
     * Optimize a model or group for better performance
     * @param {THREE.Object3D} model - The model/group to optimize
     * @param {Object} options - Optimization options
     * @param {boolean} options.disableShadows - Disable shadows (default: true)
     * @param {boolean} options.enableFrustumCulling - Enable frustum culling (default: true)
     * @param {boolean} options.optimizeTextures - Optimize textures (default: true)
     * @param {number} options.textureQuality - Texture quality multiplier (0-1, default: 0.75)
     */
    static optimizeModel(model, options = {}) {
        if (!model) return;
        
        const {
            disableShadows = true,
            enableFrustumCulling = true,
            optimizeTextures = true,
            textureQuality = 0.75
        } = options;
        
        model.traverse((child) => {
            if (child.isMesh) {
                // OPTIMIZATION: Enable frustum culling for better performance
                if (enableFrustumCulling) {
                    child.frustumCulled = true;
                }
                
                // OPTIMIZATION: Disable shadows for better performance
                if (disableShadows) {
                    child.castShadow = false;
                    child.receiveShadow = false;
                }
                
                // OPTIMIZATION: Optimize textures
                if (optimizeTextures && child.material) {
                    const material = child.material;
                    
                    // Handle both single material and array of materials
                    const materials = Array.isArray(material) ? material : [material];
                    
                    materials.forEach((mat) => {
                        if (!mat) return;
                        
                        // Optimize texture quality
                        if (mat.map) {
                            mat.map.generateMipmaps = true;
                            mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                            mat.map.magFilter = THREE.LinearFilter;
                            // Reduce texture size if needed
                            if (textureQuality < 1.0 && mat.map.image) {
                                // Note: Actual texture resizing would require canvas manipulation
                                // For now, we just optimize filter settings
                            }
                        }
                        
                        // Optimize other texture maps
                        ['normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'].forEach(mapType => {
                            if (mat[mapType]) {
                                mat[mapType].generateMipmaps = true;
                                mat[mapType].minFilter = THREE.LinearMipmapLinearFilter;
                                mat[mapType].magFilter = THREE.LinearFilter;
                            }
                        });
                        
                        // Reduce material complexity for better performance
                        // Use simpler material types if possible
                        if (mat instanceof THREE.MeshPhysicalMaterial) {
                            // Keep physical material but reduce quality
                            mat.roughness = mat.roughness || 0.5;
                            mat.metalness = mat.metalness || 0.0;
                        }
                    });
                }
            }
        });
        
        console.log('[ModelOptimizer] Model optimized:', {
            disableShadows,
            enableFrustumCulling,
            optimizeTextures
        });
    }
    
    /**
     * Optimize all models in a scene
     * @param {THREE.Scene} scene - The scene to optimize
     * @param {Object} options - Optimization options
     */
    static optimizeScene(scene, options = {}) {
        if (!scene) return;
        
        scene.traverse((child) => {
            if (child.isMesh || child.isGroup) {
                this.optimizeModel(child, options);
            }
        });
        
        console.log('[ModelOptimizer] Scene optimized');
    }
}

