const MOBILE_DEVICE_CLASS = 'mobile-device';
const MOBILE_LANDSCAPE_CLASS = 'mobile-landscape';

let listenersAttached = false;
let orientationUpdateTimeout = null;
let viewportChangeHandler = null;

const getBody = () => {
    if (typeof document === 'undefined') return null;
    return document.body || null;
};

const getSavedDeviceType = () => {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
        return window.localStorage.getItem('impuratea-device');
    } catch (error) {
        console.warn('[DeviceClassManager] Unable to access localStorage:', error);
        return null;
    }
};

export const updateOrientationClass = () => {
    if (typeof window === 'undefined') return;
    const body = getBody();
    if (!body) return;

    const isMobile = body.classList.contains(MOBILE_DEVICE_CLASS);
    if (!isMobile) {
        body.classList.remove(MOBILE_LANDSCAPE_CLASS);
        if (body.dataset) {
            body.dataset.orientation = 'desktop';
        }
        return;
    }

    let isLandscape = false;

    if (typeof window.matchMedia === 'function') {
        try {
            isLandscape = window.matchMedia('(orientation: landscape)').matches;
        } catch (error) {
            console.warn('[DeviceClassManager] matchMedia orientation check failed:', error);
        }
    }

    if (!isLandscape) {
        // Fallback using viewport dimensions
        if (window.innerWidth && window.innerHeight) {
            isLandscape = window.innerWidth > window.innerHeight;
        }
    }

    body.classList.toggle(MOBILE_LANDSCAPE_CLASS, isLandscape);

    if (body.dataset) {
        body.dataset.orientation = isLandscape ? 'landscape' : 'portrait';
    }
};

const scheduleOrientationUpdate = () => {
    if (orientationUpdateTimeout) {
        clearTimeout(orientationUpdateTimeout);
    }
    orientationUpdateTimeout = setTimeout(updateOrientationClass, 150);
};

export const applyDeviceClasses = (deviceTypeParam) => {
    const body = getBody();
    if (!body) return;

    const deviceType = deviceTypeParam || getSavedDeviceType();
    const isMobile = deviceType === 'mobile';

    body.classList.toggle(MOBILE_DEVICE_CLASS, isMobile);

    if (body.dataset) {
        body.dataset.device = deviceType || 'desktop';
    }

    updateOrientationClass();
    scheduleOrientationUpdate();
};

export const initDeviceClassManager = () => {
    if (typeof window === 'undefined') return;
    const body = getBody();
    if (!body) return;

    applyDeviceClasses();

    if (listenersAttached) return;

    viewportChangeHandler = () => {
        scheduleOrientationUpdate();
    };

    window.addEventListener('orientationchange', viewportChangeHandler);
    window.addEventListener('resize', viewportChangeHandler);

    listenersAttached = true;
};

export const teardownDeviceClassManager = () => {
    if (typeof window === 'undefined') return;
    if (!listenersAttached) return;

    if (viewportChangeHandler) {
        window.removeEventListener('orientationchange', viewportChangeHandler);
        window.removeEventListener('resize', viewportChangeHandler);
        viewportChangeHandler = null;
    }

    if (orientationUpdateTimeout) {
        clearTimeout(orientationUpdateTimeout);
        orientationUpdateTimeout = null;
    }

    listenersAttached = false;
};

