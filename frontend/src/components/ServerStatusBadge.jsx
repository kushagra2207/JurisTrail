import { useState, useEffect } from 'react';
import { api } from '../api/api';

export default function ServerStatusBadge() {
    const [status, setStatus] = useState('waking'); // 'waking' | 'awake' | 'unreachable'

    useEffect(() => {
        let isMounted = true;
        let pollTimer = null;
        let timeoutTimer = null;
        let isChecking = false;

        // 95-second timeout for wake-up
        const startTimeoutTimer = () => {
            if (timeoutTimer) clearTimeout(timeoutTimer);
            timeoutTimer = setTimeout(() => {
                if (isMounted) {
                    setStatus(prev => {
                        if (prev === 'waking') {
                            console.warn("Backend server failed to respond within 95 seconds. Setting state to unreachable.");
                            return 'unreachable';
                        }
                        return prev;
                    });
                }
            }, 95000);
        };

        const checkHealth = async () => {
            if (isChecking) return;
            isChecking = true;

            try {
                await api.system.checkHealth();
                if (isMounted) {
                    setStatus('awake');
                    
                    // Once awake, clear the timeout
                    if (timeoutTimer) {
                        clearTimeout(timeoutTimer);
                        timeoutTimer = null;
                    }

                    // Reset polling timer to keep-alive mode (every 30 seconds)
                    setupPolling(30000);
                }
            } catch (err) {
                if (isMounted) {
                    console.log("Server health check failed:", err.message);
                    
                    // If we were previously awake but now the server is not responding,
                    // we transition back to waking and restart the timeout
                    setStatus(prev => {
                        if (prev === 'awake') {
                            startTimeoutTimer();
                            // Re-enable fast polling
                            setupPolling(5000);
                            return 'waking';
                        }
                        return prev;
                    });
                }
            } finally {
                isChecking = false;
            }
        };

        const setupPolling = (interval) => {
            if (pollTimer) clearInterval(pollTimer);
            pollTimer = setInterval(checkHealth, interval);
        };

        // Start timeout timer immediately
        startTimeoutTimer();
        // Initial check immediately
        checkHealth();
        // Start with fast polling (every 5 seconds) to catch wake-up quickly
        setupPolling(5000);

        return () => {
            isMounted = false;
            if (pollTimer) clearInterval(pollTimer);
            if (timeoutTimer) clearTimeout(timeoutTimer);
        };
    }, []);

    if (status === 'awake') return null;

    return (
        <div 
            className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold shadow-xl transition-all duration-500 transform hover:scale-105 select-none ${
                status === 'waking' 
                    ? 'bg-[#2a1b12] border-[#c5a059] text-[#dfb86c]' 
                    : 'bg-[#8b0000] border-[#aa1d1d] text-[#fcfbf7]'
            }`}
        >
            {status === 'waking' ? (
                <>
                    <i className="fa-solid fa-circle-notch animate-spin mr-1 text-[#dfb86c]"></i>
                    <span>Waking up server...</span>
                </>
            ) : (
                <>
                    <i className="fa-solid fa-triangle-exclamation text-[#fcfbf7] mr-1 animate-pulse"></i>
                    <span>Server unreachable</span>
                </>
            )}
        </div>
    );
}
