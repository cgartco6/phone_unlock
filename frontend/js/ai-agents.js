/**
 * AI Agents Frontend Controller
 * Manages communication with backend AI agents
 */

class AIAgentsController {
    constructor() {
        this.socket = null;
        this.progressCallbacks = [];
        this.logCallbacks = [];
        this.currentDevice = null;
    }

    /**
     * Initialize AI agents connection
     */
    async initialize() {
        try {
            await this.initializeWebSocket();
            await this.loadAISystems();
            console.log('AI Agents Controller initialized');
        } catch (error) {
            console.error('Failed to initialize AI Agents:', error);
            this.showError('AI system initialization failed');
        }
    }

    /**
     * Initialize WebSocket for real-time updates
     */
    async initializeWebSocket() {
        return new Promise((resolve, reject) => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/unlock-progress`;
            
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onopen = () => {
                console.log('WebSocket connected');
                resolve();
            };
            
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleProgressUpdate(data);
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };
            
            this.socket.onclose = () => {
                console.log('WebSocket disconnected');
                // Attempt reconnection
                setTimeout(() => this.initializeWebSocket(), 5000);
            };
        });
    }

    /**
     * Load AI systems status
     */
    async loadAISystems() {
        try {
            const response = await fetch('/health');
            const status = await response.json();
            
            this.updateSystemStatus(status.components);
        } catch (error) {
            console.error('Failed to load AI systems status:', error);
        }
    }

    /**
     * Detect connected device
     */
    async detectDevice() {
        try {
            this.showLoading('Detecting device...');
            
            const response = await fetch('/api/detect-device', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.currentDevice = result.device;
                this.handleDeviceDetection(result);
            } else {
                this.handleDetectionError(result.error);
            }
        } catch (error) {
            console.error('Device detection failed:', error);
            this.handleDetectionError(error.message);
        }
    }

    /**
     * Start unlock process
     */
    async startUnlock(deviceId, method = 'auto') {
        try {
            this.showLoading('Starting unlock process...');
            
            const response = await fetch(`/api/start-unlock?device_id=${deviceId}&method=${method}`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.handleUnlockStart(result);
            } else {
                this.handleUnlockError(result.error, result.self_healing);
            }
        } catch (error) {
            console.error('Unlock start failed:', error);
            this.handleUnlockError(error.message);
        }
    }

    /**
     * Handle progress updates from WebSocket
     */
    handleProgressUpdate(progress) {
        // Update progress bar
        this.updateProgressBar(progress.overall_progress);
        
        // Update current step
        this.updateCurrentStep(progress.current_step, progress.step_progress);
        
        // Update logs
        this.addLogEntry(progress);
        
        // Notify callbacks
        this.progressCallbacks.forEach(callback => callback(progress));
    }

    /**
     * Handle device detection results
     */
    handleDeviceDetection(result) {
        this.hideLoading();
        
        // Update device information
        this.updateDeviceInfo(result.device);
        
        // Update analysis results
        this.updateAnalysisResults(result.analysis);
        
        // Show recommended actions
        this.showRecommendedActions(result.recommended_actions);
        
        // Notify success
        this.showSuccess('Device detected successfully');
    }

    /**
     * Handle detection errors
     */
    handleDetectionError(error, selfHealing = null) {
        this.hideLoading();
        
        if (selfHealing && selfHealing.recovered) {
            this.showWarning('Device detection issue resolved automatically');
            // Retry detection
            setTimeout(() => this.detectDevice(), 1000);
        } else {
            this.showError(`Device detection failed: ${error}`);
            
            if (selfHealing && selfHealing.suggestions) {
                this.showSuggestions(selfHealing.suggestions);
            }
        }
    }

    /**
     * Handle unlock start
     */
    handleUnlockStart(result) {
        this.hideLoading();
        this.showSuccess('Unlock process started successfully');
        
        // Show unlock plan
        this.showUnlockPlan(result.plan);
        
        // Start progress tracking
        this.startProgressTracking();
    }

    /**
     * Handle unlock errors
     */
    handleUnlockError(error, selfHealing = null) {
        this.hideLoading();
        
        if (selfHealing && selfHealing.recovered) {
            this.showWarning('Unlock issue resolved automatically');
        } else {
            this.showError(`Unlock failed: ${error}`);
            
            if (selfHealing && selfHealing.alternative_methods) {
                this.showAlternativeMethods(selfHealing.alternative_methods);
            }
        }
    }

    /**
     * UI Update Methods
     */
    updateSystemStatus(components) {
        const statusContainer = document.getElementById('system-status');
        if (statusContainer) {
            let html = '';
            for (const [name, status] of Object.entries(components)) {
                const statusClass = status.status === 'operational' ? 'status-good' : 'status-bad';
                html += `
                    <div class="status-item">
                        <span class="status-label">${name}:</span>
                        <span class="status-value ${statusClass}">${status.status}</span>
                    </div>
                `;
            }
            statusContainer.innerHTML = html;
        }
    }

    updateProgressBar(progress) {
        const progressBar = document.getElementById('unlock-progress');
        const progressPercent = document.getElementById('progress-percent');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        if (progressPercent) {
            progressPercent.textContent = `${progress}%`;
        }
    }

    updateCurrentStep(step, stepProgress) {
        const stepElement = document.getElementById('current-step');
        if (stepElement) {
            stepElement.textContent = step || 'Processing...';
        }
    }

    addLogEntry(entry) {
        const logContainer = document.getElementById('log-output');
        if (logContainer) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            const timestamp = new Date().toLocaleTimeString();
            logEntry.innerHTML = `
                <span class="log-time">[${timestamp}]</span>
                <span class="log-info">${entry.current_step}</span>
                <span class="log-progress">${entry.overall_progress}%</span>
            `;
            
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }

    updateDeviceInfo(device) {
        // Update device information in UI
        const elements = {
            'manufacturer': device.manufacturer,
            'model': device.model,
            'serial': device.serial_number,
            'version': device.android_version
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }
    }

    /**
     * Utility Methods
     */
    showLoading(message) {
        // Show loading indicator
        console.log('Loading:', message);
    }

    hideLoading() {
        // Hide loading indicator
    }

    showSuccess(message) {
        // Show success message
        console.log('Success:', message);
    }

    showError(message) {
        // Show error message
        console.error('Error:', message);
    }

    showWarning(message) {
        // Show warning message
        console.warn('Warning:', message);
    }

    showRecommendedActions(actions) {
        // Display recommended actions
    }

    showUnlockPlan(plan) {
        // Display unlock plan
    }

    showAlternativeMethods(methods) {
        // Display alternative methods
    }

    showSuggestions(suggestions) {
        // Display suggestions
    }

    startProgressTracking() {
        // Start progress tracking UI
    }

    /**
     * Event Listeners
     */
    onProgressUpdate(callback) {
        this.progressCallbacks.push(callback);
    }

    onLogUpdate(callback) {
        this.logCallbacks.push(callback);
    }
}

// Initialize AI Agents Controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiAgents = new AIAgentsController();
    window.aiAgents.initialize();
});
