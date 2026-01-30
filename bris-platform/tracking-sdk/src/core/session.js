/**
 * Session Manager
 * Handles session ID, device fingerprint, and metadata
 */

class Session {
    constructor(config) {
        this.config = config;
        this.sessionId = config.sessionId || this._generateSessionId();
        this.userId = config.userId || this._generateUserId();
        this.deviceFingerprint = this._generateFingerprint();
        this.startTime = Date.now();
        this.metadata = this._collectMetadata();

        // Store session in sessionStorage for continuity
        this._persistSession();
    }

    _generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    _generateUserId() {
        // Check localStorage first
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem('bris_user_id');
            if (stored) return stored;

            // Generate new
            const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('bris_user_id', userId);
            return userId;
        }

        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    _generateFingerprint() {
        // Simple browser fingerprinting (NOT for security, just tracking)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('BRIS', 2, 2);
        const canvasHash = canvas.toDataURL().slice(-50);

        const fingerprint = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: window.screen.width + 'x' + window.screen.height,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            canvasHash: canvasHash,
            plugins: Array.from(navigator.plugins || []).map(p => p.name).join(',')
        };

        // Hash to single string
        return this._hashObject(fingerprint);
    }

    _hashObject(obj) {
        const str = JSON.stringify(obj);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'fp_' + Math.abs(hash).toString(36);
    }

    _collectMetadata() {
        return {
            url: window.location.href,
            referrer: document.referrer,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            timestamp: new Date().toISOString()
        };
    }

    _persistSession() {
        if (typeof sessionStorage === 'undefined') return;

        const sessionData = {
            sessionId: this.sessionId,
            userId: this.userId,
            deviceFingerprint: this.deviceFingerprint,
            startTime: this.startTime
        };
        sessionStorage.setItem('bris_session', JSON.stringify(sessionData));
    }

    toJSON() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            deviceFingerprint: this.deviceFingerprint,
            startTime: this.startTime,
            metadata: this.metadata
        };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Session;
}
