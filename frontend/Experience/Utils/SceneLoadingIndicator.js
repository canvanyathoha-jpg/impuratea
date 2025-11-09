/**
 * Modern Scene Loading Indicator
 * Professional loading screen for scene transitions
 */

export default class SceneLoadingIndicator {
    static show() {
        // Remove existing loader if any
        const existingLoader = document.getElementById('scene-loading-indicator');
        if (existingLoader) {
            existingLoader.remove();
        }

        // Clear any pending timers from a previous show() call
        // We do this up front so we never carry over stale timers between scenes.
        SceneLoadingIndicator.clearTimers();

        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'scene-loading-indicator';
        loadingIndicator.style.pointerEvents = 'none';
        loadingIndicator.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%);
                z-index: 10000001;
                display: flex;
                justify-content: center;
                align-items: center;
                pointer-events: none;
                opacity: 0;
                animation: fadeIn 0.3s ease forwards;
            ">
                <div style="
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 35px;
                    padding: 50px 70px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 30px;
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 60px rgba(255, 255, 255, 0.02);
                ">
                    <!-- Spinning Logo -->
                    <div style="
                        width: 80px;
                        height: 80px;
                        background: linear-gradient(135deg, rgba(139, 0, 0, 0.3), rgba(30, 64, 124, 0.3));
                        border-radius: 50%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        box-shadow:
                            0 0 30px rgba(139, 0, 0, 0.4),
                            0 0 60px rgba(30, 64, 124, 0.3),
                            inset 0 0 20px rgba(255, 255, 255, 0.1);
                        animation: pulse 2s ease-in-out infinite;
                    ">
                        <div style="
                            width: 40px;
                            height: 40px;
                            border: 3px solid transparent;
                            border-top-color: rgba(255, 255, 255, 0.9);
                            border-right-color: rgba(139, 0, 0, 0.7);
                            border-radius: 50%;
                            animation: spin 1.2s linear infinite;
                        "></div>
                    </div>

                    <!-- Loading Text -->
                    <div style="
                        color: rgba(255, 255, 255, 0.95);
                        font-size: 26px;
                        font-weight: 300;
                        font-family: 'Gilroy', -apple-system, BlinkMacSystemFont, sans-serif;
                        letter-spacing: 4px;
                        text-transform: uppercase;
                        text-shadow:
                            0 0 20px rgba(139, 0, 0, 0.6),
                            0 0 40px rgba(30, 64, 124, 0.4),
                            0 4px 20px rgba(0, 0, 0, 0.5);
                        animation: textGlow 2s ease-in-out infinite;
                    ">
                        Memuat Scene
                    </div>

                    <!-- Progress Bar -->
                    <div style="
                        width: 320px;
                        height: 4px;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
                    ">
                        <div id="loading-progress-bar" style="
                            width: 100%;
                            height: 100%;
                            background: linear-gradient(90deg,
                                rgba(139, 0, 0, 0.8) 0%,
                                rgba(30, 64, 124, 0.8) 50%,
                                rgba(255, 215, 0, 0.8) 100%
                            );
                            border-radius: 10px;
                            animation: progressSlide 1.5s ease-in-out infinite;
                            box-shadow: 0 0 15px rgba(139, 0, 0, 0.6);
                        "></div>
                    </div>

                    <!-- Subtitle -->
                    <div style="
                        color: rgba(255, 255, 255, 0.5);
                        font-size: 13px;
                        font-weight: 400;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                        font-family: 'Gilroy', sans-serif;
                        animation: fadeInOut 2s ease-in-out infinite;
                    " id="loading-subtitle">
                        Mohon tunggu sebentar...
                    </div>
                </div>

                <!-- Background Orbs -->
                <div style="
                    position: absolute;
                    top: -20%;
                    right: -10%;
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, rgba(139, 0, 0, 0.15) 0%, transparent 70%);
                    border-radius: 50%;
                    filter: blur(60px);
                    animation: floatOrb 8s ease-in-out infinite;
                "></div>
                <div style="
                    position: absolute;
                    bottom: -20%;
                    left: -10%;
                    width: 350px;
                    height: 350px;
                    background: radial-gradient(circle, rgba(30, 64, 124, 0.15) 0%, transparent 70%);
                    border-radius: 50%;
                    filter: blur(60px);
                    animation: floatOrb 10s ease-in-out infinite reverse;
                "></div>
            </div>
        `;

        // Add animations (only once)
        if (!document.getElementById('scene-loading-animations')) {
            const style = document.createElement('style');
            style.id = 'scene-loading-animations';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow:
                            0 0 30px rgba(139, 0, 0, 0.4),
                            0 0 60px rgba(30, 64, 124, 0.3),
                            inset 0 0 20px rgba(255, 255, 255, 0.1);
                    }
                    50% {
                        transform: scale(1.05);
                        box-shadow:
                            0 0 40px rgba(139, 0, 0, 0.6),
                            0 0 80px rgba(30, 64, 124, 0.5),
                            inset 0 0 30px rgba(255, 255, 255, 0.15);
                    }
                }
                @keyframes textGlow {
                    0%, 100% {
                        opacity: 0.9;
                        text-shadow:
                            0 0 20px rgba(139, 0, 0, 0.6),
                            0 0 40px rgba(30, 64, 124, 0.4),
                            0 4px 20px rgba(0, 0, 0, 0.5);
                    }
                    50% {
                        opacity: 1;
                        text-shadow:
                            0 0 30px rgba(139, 0, 0, 0.8),
                            0 0 60px rgba(30, 64, 124, 0.6),
                            0 4px 20px rgba(0, 0, 0, 0.5);
                    }
                }
                @keyframes progressSlide {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.7; }
                }
                @keyframes floatOrb {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                        opacity: 0.3;
                    }
                    50% {
                        transform: translate(-50px, -50px) scale(1.1);
                        opacity: 0.5;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(loadingIndicator);

        // Inform the user if loading takes unusually long instead of hiding the overlay too early.
        // After 15 seconds we update the subtitle so the player knows the app is still working.
        SceneLoadingIndicator.longLoadTimerId = setTimeout(() => {
            console.warn('[SceneLoadingIndicator] Loading has taken longer than 15s, keeping overlay visible.');
            const subtitle = document.getElementById('loading-subtitle');
            if (subtitle) {
                subtitle.textContent = 'Masih memuat aset besar, mohon tetap menunggu...';
            }
        }, 15000);

        return loadingIndicator;
    }

    static hide() {
        // Always clear timers when hiding to avoid stale callbacks firing on the next scene.
        SceneLoadingIndicator.clearTimers();

        const loadingIndicator = document.getElementById('scene-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.opacity = '0';
            loadingIndicator.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                if (loadingIndicator && document.body.contains(loadingIndicator)) {
                    loadingIndicator.remove();
                }
            }, 500);
        }
    }

    static clearTimers() {
        if (SceneLoadingIndicator.longLoadTimerId) {
            clearTimeout(SceneLoadingIndicator.longLoadTimerId);
            SceneLoadingIndicator.longLoadTimerId = null;
        }
    }
}

SceneLoadingIndicator.longLoadTimerId = null;
