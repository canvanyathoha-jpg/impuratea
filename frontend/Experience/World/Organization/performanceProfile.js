export const getScenePerformanceProfile = (experience) => {
    const performanceManager = experience?.performanceManager || null;
    const deviceProfile = performanceManager?.getDeviceProfile?.();
    const isLowEndDevice = !!deviceProfile?.isLowEnd;

    return {
        performanceManager,
        deviceProfile,
        isLowEndDevice,
        enablePostProcessing: performanceManager?.shouldUsePostProcessing?.() ?? false,
        enableDynamicShadows: performanceManager?.shouldEnableDynamicShadows?.() ?? false,
        enableAdvancedAtmosphere: performanceManager?.shouldUseAdvancedAtmosphere?.() ?? !isLowEndDevice,
    };
};

