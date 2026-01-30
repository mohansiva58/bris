/**
 * Event Batcher
 * Batches events and sends them at intervals
 */

class Batcher {
    constructor(config, transport) {
        this.config = config;
        this.transport = transport;
        this.eventQueue = [];
        this.batchInterval = config.batchInterval || 3000;
        this.maxBatchSize = config.maxBatchSize || 50;
        this.batchTimer = null;

        // Start batch timer
        this._startBatchTimer();
    }

    add(event) {
        this.eventQueue.push(event);

        // If queue exceeds max size, flush immediately
        if (this.eventQueue.length >= this.maxBatchSize) {
            this.flush();
        }
    }

    flush() {
        if (this.eventQueue.length === 0) return;

        const eventsToSend = this.eventQueue.splice(0, this.maxBatchSize);
        this.transport.send(eventsToSend);

        if (this.config.debug) {
            console.log('[BRIS] Sent ' + eventsToSend.length + ' events');
        }
    }

    _startBatchTimer() {
        this.batchTimer = setInterval(() => {
            this.flush();
        }, this.batchInterval);
    }

    destroy() {
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
            this.batchTimer = null;
        }

        // Final flush
        this.flush();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Batcher;
}
