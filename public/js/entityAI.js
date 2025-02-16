class EntityAI {
    constructor(entityRenderer, sensorControl, entityControl, neuralNetwork) {
        this.entityRenderer = entityRenderer;
        this.sensorControl = sensorControl;
        this.entityControl = entityControl;
        this.brain = neuralNetwork || new NeuralNetwork([4, 8, 8, 3], 0.01, 'relu');

        this.previousState = null;
        this.epsilon = 0.2;
        this.lastActionTime = Date.now();
        this.actionHistory = [];
        this.baseActionCooldown = 1000;
        this.maxActionCooldown = 5000;
        this.minActionCooldown = 500;
        this.actionCooldown = this.baseActionCooldown;
        this.successStreak = 0;
        this.debug = true;

        this.exploredAreas = new Set();
        this.lastPosition = { x: this.entityRenderer.x, y: this.entityRenderer.y };
        this.stationaryCounter = 0;
        this.collisionCounter = 0;
        this.beaconReachedCounter = 0;
        this.totalReward = 0;
        this.rewardCount = 0;
        this.lastBeaconDistance = Infinity;
        this.cumulativeReward = 0;
        this.lastAction = null;
        this.isBeaconReached = false;
    }

    startMonitoring() {
        setInterval(() => {
            if (this.isRepetitiveOrInactive()) {
                if (this.debug) {
                    console.log('Asynchronous Monitoring: Encouraging exploration...');
                }
                this.epsilon = Math.min(this.epsilon * 1.1, 0.5);
            } else {
                this.epsilon = Math.max(this.epsilon * 0.99, 0.1);
            }
        }, 5000);
    }

    update() {
        const sensorData = this.sensorControl.getSensorData();
        const inputArray = this.normalizeSensorData(sensorData);

        if (Math.random() < this.epsilon) {
            this.takeRandomAction();
        } else {
            const decision = this.brain.feedForward(inputArray);
            const normalizedDecision = this.normalizeDecision(decision);
            if (this.debug) {
                console.log("inputArray: ", inputArray);
                console.log("normalizedDecision: ", normalizedDecision);
            }
            this.previousState = { inputArray, decision: normalizedDecision, action: this.lastAction };
            this.makeDecision(normalizedDecision);
        }

        this.updateExplorationStatus();
        this.evaluateOutcome();
    }

    normalizeSensorData(sensorData) {
        return [
            sensorData.leftSensor.distance / 100,
            sensorData.leftSensor.detected ? 1 : 0,
            sensorData.rightSensor.distance / 100,
            sensorData.rightSensor.detected ? 1 : 0
        ];
    }

    normalizeDecision(decision) {
        const sum = decision.reduce((a, b) => a + b, 0);
        return decision.map(d => d / sum);
    }

    makeDecision(decision) {
        const actionThreshold = 0.4;
        let actionTaken = false;

        // Draw decision confidence bars
        if (this.debug) {
            const barWidth = 50;
            const barHeight = 15;
            const startX = 10;
            const startY = 10;
            const ctx = this.entityRenderer.ctx;

            // Forward confidence
            ctx.fillStyle = decision[0] > actionThreshold ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
            ctx.fillRect(startX, startY, barWidth * decision[0], barHeight);
            ctx.strokeRect(startX, startY, barWidth, barHeight);
            ctx.fillStyle = 'white';
            ctx.fillText('Forward', startX + 5, startY + 12);

            // Left turn confidence
            ctx.fillStyle = decision[1] > actionThreshold ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
            ctx.fillRect(startX, startY + 20, barWidth * decision[1], barHeight);
            ctx.strokeRect(startX, startY + 20, barWidth, barHeight);
            ctx.fillStyle = 'white';
            ctx.fillText('Left', startX + 5, startY + 32);

            // Right turn confidence
            ctx.fillStyle = decision[2] > actionThreshold ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
            ctx.fillRect(startX, startY + 40, barWidth * decision[2], barHeight);
            ctx.strokeRect(startX, startY + 40, barWidth, barHeight);
            ctx.fillStyle = 'white';
            ctx.fillText('Right', startX + 5, startY + 52);
        }

        if (decision[0] > actionThreshold) {
            this.entityControl.moveForward(5);
            this.lastAction = 'moveForward';
            actionTaken = true;
        } else if (decision[1] > decision[2] && decision[1] > actionThreshold) {
            this.entityControl.turnLeft(Math.PI / 18);
            this.lastAction = 'turnLeft';
            actionTaken = true;
        } else if (decision[2] > decision[1] && decision[2] > actionThreshold) {
            this.entityControl.turnRight(Math.PI / 18);
            this.lastAction = 'turnRight';
            actionTaken = true;
        }

        if (actionTaken) {
            this.updateActionHistory(this.lastAction);
            this.lastActionTime = Date.now();
        } else {
            this.lastAction = 'noAction';
        }
    }

    takeRandomAction() {
        const randomAction = Math.floor(Math.random() * 3);
        switch (randomAction) {
            case 0:
                this.entityControl.moveForward(5);
                this.lastAction = 'moveForward';
                break;
            case 1:
                this.entityControl.turnLeft(Math.PI / 18);
                this.lastAction = 'turnLeft';
                break;
            case 2:
                this.entityControl.turnRight(Math.PI / 18);
                this.lastAction = 'turnRight';
                break;
        }
        this.updateActionHistory(this.lastAction);
    }

    updateActionHistory(currentAction) {
        if (currentAction) {
            this.actionHistory.push({ action: currentAction, timestamp: Date.now() });
            if (this.actionHistory.length > 20) {
                this.actionHistory.shift();
            }
        }
    }

    updateExplorationStatus() {
        const currentPosition = `${Math.round(this.entityRenderer.x)},${Math.round(this.entityRenderer.y)}`;
        this.exploredAreas.add(currentPosition);

        if (this.entityRenderer.x === this.lastPosition.x && this.entityRenderer.y === this.lastPosition.y) {
            this.stationaryCounter++;
        } else {
            this.stationaryCounter = 0;
        }

        this.lastPosition = { x: this.entityRenderer.x, y: this.entityRenderer.y };
    }

    evaluateOutcome() {
        if (this.debug) {
            console.log('Evaluating outcome...');
        }
        const currentSensorData = this.sensorControl.getSensorData();
        let reward = this.calculateReward(currentSensorData);

        if (reward > 0.3) {
            this.successStreak++;
            this.actionCooldown = Math.max(
                this.minActionCooldown,
                this.actionCooldown * 0.95
            );
        } else if (reward < -0.2) {
            this.successStreak = 0;
            this.actionCooldown = Math.min(
                this.maxActionCooldown,
                this.actionCooldown * 1.1
            );
        }

        if (this.successStreak > 10) {
            this.actionCooldown = this.baseActionCooldown;
            this.successStreak = 0;
        }

        if (this.previousState) {
            this.brain.train([{ inputs: this.previousState.inputArray, targets: reward }], 1);
        }
        this.updateAverageReward(reward[0]);
    }

    calculateReward(sensorData) {
        let reward = 0;

        reward += 0.05;

        if (this.exploredAreas.size % 10 === 0) {
            reward += 0.2;
            if (this.debug) console.log("Positive reward for exploration");
        }

        if (this.entityRenderer.checkCollision()) {
            reward -= 0.5;
            this.collisionCounter++;
            if (this.debug) console.log("Negative reward for collision");
        }

        const leftBeaconDetected = sensorData.leftSensor.type === 'beacon';
        const rightBeaconDetected = sensorData.rightSensor.type === 'beacon';
        const beaconDistance = Math.min(
            leftBeaconDetected ? sensorData.leftSensor.distance : Infinity,
            rightBeaconDetected ? sensorData.rightSensor.distance : Infinity
        );

        if (leftBeaconDetected || rightBeaconDetected) {
            reward += 0.3;
            if (this.debug) console.log("Positive reward for detecting a beacon");

            if (beaconDistance < Infinity) {
                if (beaconDistance < this.lastBeaconDistance) {
                    reward += 0.5;
                    if (this.debug) console.log("Positive reward for approaching beacon");
                }
                if (this.isBeaconReached) {
                    reward += 1;
                    if (this.debug) console.log("Positive reward for farming beacon");
                }
                this.lastBeaconDistance = beaconDistance;
            }
        } else {
            this.lastBeaconDistance = Infinity;
        }

        if (this.stationaryCounter > 10 || this.isMovingInCircles()) {
            reward -= 0.1;
            if (this.debug) console.log("Small negative reward for inactivity or circular movement");
        }

        if ((sensorData.leftSensor.type === 'wall' && sensorData.leftSensor.distance < 10) ||
            (sensorData.rightSensor.type === 'wall' && sensorData.rightSensor.distance < 10)) {
            reward -= 0.05;
            if (this.debug) console.log("Very small negative reward for being close to a wall");
        }

        this.cumulativeReward += reward;
        return [reward, 0, 0];
    }

    onBeaconReached() {
        this.isBeaconReached = true;
        if (this.debug) console.log("Beacon reached and being farmed");
    }

    onBeaconRelocated() {
        this.beaconReachedCounter++;
        this.isBeaconReached = false;
        this.lastBeaconDistance = Infinity;
        if (this.debug) console.log("Beacon relocated. Total beacons reached:", this.beaconReachedCounter);
    }

    isMovingInCircles() {
        if (this.actionHistory.length < 20) return false;

        const recentActions = this.actionHistory.slice(-20);
        const leftTurns = recentActions.filter(a => a.action === 'turnLeft').length;
        const rightTurns = recentActions.filter(a => a.action === 'turnRight').length;

        return Math.abs(leftTurns - rightTurns) < 5;
    }

    isRepetitiveOrInactive() {
        const currentTime = Date.now();
        const timeThreshold = 5000;
        if (this.actionHistory.length === 0 || (currentTime - this.lastActionTime) > timeThreshold) {
            return true;
        }

        const recentActions = this.actionHistory.slice(-5).map(a => a.action);
        const mostCommonAction = this.findMostCommonAction(recentActions);
        const repetitionThreshold = 0.8;
        const isRepetitive = recentActions.filter(action => action === mostCommonAction).length / recentActions.length > repetitionThreshold;

        return isRepetitive;
    }

    findMostCommonAction(actions) {
        const count = actions.reduce((acc, action) => {
            acc[action] = (acc[action] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(count).reduce((a, b) => count[a] > count[b] ? a : b);
    }

    updateAverageReward(reward) {
        this.totalReward += reward;
        this.rewardCount++;
    }

    getPerformanceMetrics() {
        return {
            exploredAreas: this.exploredAreas.size,
            collisions: this.collisionCounter,
            beaconsReached: this.beaconReachedCounter,
            averageReward: this.calculateAverageReward(),
            cumulativeReward: this.cumulativeReward,
            currentEpsilon: this.epsilon
        };
    }

    calculateAverageReward() {
        return this.rewardCount > 0 ? this.totalReward / this.rewardCount : 0;
    }

    saveState() {
        console.log("Starting saveState process");
        const weights = this.brain.weights;
        const biases = this.brain.biases;

        for (let layer = 0; layer < weights.length; layer++) {
            console.log(`Saving weights for layer ${layer}`);
            this.saveLayerState(layer, 'weight', weights[layer]);
            console.log(`Saving biases for layer ${layer}`);
            this.saveLayerState(layer, 'bias', biases[layer]);
        }

        // Save additional state information
        console.log("Saving metadata");
        this.saveLayerState('metadata', 'exploredAreas', Array.from(this.exploredAreas));
        this.saveLayerState('metadata', 'cumulativeReward', this.cumulativeReward);
        this.saveLayerState('metadata', 'collisionCounter', this.collisionCounter);
        this.saveLayerState('metadata', 'beaconReachedCounter', this.beaconReachedCounter);
    }

    saveLayerState(layer, type, data) {
        console.log(`Preparing to save state for layer: ${layer}, type: ${type}`);
        const state = {
            layer: layer,
            type: type,
            data: JSON.stringify(data)
        };

        console.log(`Sending request to save state`, state);
        fetch('../src/api/saveState.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
        })
            .then(response => {
                console.log(`Received response with status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log(`State saved successfully for layer ${layer}, type ${type}`, data);
            })
            .catch(error => {
                console.error(`Error saving state for layer ${layer}, type ${type}:`, error);
            });
    }

    loadState(state) {
        if (state && state.weights && state.biases) {
            const weightsArray = Object.keys(state.weights).sort().map(key => state.weights[key]);
            const biasesArray = Object.keys(state.biases).sort().map(key => state.biases[key]);

            const formattedState = {
                weights: weightsArray,
                biases: biasesArray
            };

            this.brain.importState(formattedState);

            // Load additional state information
            if (state.metadata) {
                this.exploredAreas = new Set(state.metadata.exploredAreas || []);
                this.cumulativeReward = state.metadata.cumulativeReward || 0;
                this.collisionCounter = state.metadata.collisionCounter || 0;
                this.beaconReachedCounter = state.metadata.beaconReachedCounter || 0;
            }
        } else {
            console.error('Invalid state structure:', state);
        }
    }

    getState() {
        return {
            weights: this.brain.weights,
            biases: this.brain.biases,
            exploredAreas: Array.from(this.exploredAreas),
            cumulativeReward: this.cumulativeReward,
            collisionCounter: this.collisionCounter,
            beaconReachedCounter: this.beaconReachedCounter
        };
    }
}