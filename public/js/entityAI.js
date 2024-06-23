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
        this.actionCooldown = 5000;
        this.debug = true;

        // New properties for improved reward system
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
        }, 5000); // Check every 5 seconds
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
        const actionThreshold = 0.4;  // Adjusted threshold
        let actionTaken = false;

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
        const randomAction = Math.floor(Math.random() * 3); // 0, 1, or 2
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

        // Check if the entity has moved
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

        if (this.previousState) {
            this.brain.train([{ inputs: this.previousState.inputArray, targets: reward }], 1);
        }
        this.updateAverageReward(reward[0]);
    }

    calculateReward(sensorData) {
        let reward = 0;

        // Small positive reward for every action (encourages exploration)
        reward += 0.05;

        // Reward for exploring new areas
        if (this.exploredAreas.size % 10 === 0) {
            reward += 0.2;
            if (this.debug) console.log("Positive reward for exploration");
        }

        // Penalty for collisions
        if (this.entityRenderer.checkCollision()) {
            reward -= 0.5;
            this.collisionCounter++;
            if (this.debug) console.log("Negative reward for collision");
        }

        // Reward for sensing and approaching beacons
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
                if (beaconDistance < 10) {
                    reward += 1;
                    this.beaconReachedCounter++;
                    if (this.debug) console.log("Positive reward for reaching beacon");
                }
                this.lastBeaconDistance = beaconDistance;
            }
        } else {
            this.lastBeaconDistance = Infinity;
        }

        // Small penalty for staying stationary or moving in circles
        if (this.stationaryCounter > 10 || this.isMovingInCircles()) {
            reward -= 0.1;
            if (this.debug) console.log("Small negative reward for inactivity or circular movement");
        }

        // Very small penalty for being close to a wall
        if ((sensorData.leftSensor.type === 'wall' && sensorData.leftSensor.distance < 10) ||
            (sensorData.rightSensor.type === 'wall' && sensorData.rightSensor.distance < 10)) {
            reward -= 0.05;
            if (this.debug) console.log("Very small negative reward for being close to a wall");
        }

        this.cumulativeReward += reward;
        return [reward, 0, 0];  // Format expected by the neural network
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
        const timeThreshold = 5000; // 5 seconds
        if (this.actionHistory.length === 0 || (currentTime - this.lastActionTime) > timeThreshold) {
            return true; // Inactive if no actions or last action was long ago
        }

        // Check if the last 5 actions are the same
        const recentActions = this.actionHistory.slice(-5).map(a => a.action);
        const mostCommonAction = this.findMostCommonAction(recentActions);
        const repetitionThreshold = 0.8; // 80% of actions are the same
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
        const state = {
            weights: this.brain.weights,
            biases: this.brain.biases,
            exploredAreas: Array.from(this.exploredAreas),
            cumulativeReward: this.cumulativeReward,
            collisionCounter: this.collisionCounter,
            beaconReachedCounter: this.beaconReachedCounter
        };

        fetch('../src/api/saveState.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
        })
            .then(response => response.json())
            .then(data => console.log("State saved successfully", data))
            .catch(error => console.error('Error saving state', error));
    }

    loadState(state) {
        if (state && state.weights && state.biases) {
            this.brain.importState({ weights: state.weights, biases: state.biases });
            this.exploredAreas = new Set(state.exploredAreas || []);
            this.cumulativeReward = state.cumulativeReward || 0;
            this.collisionCounter = state.collisionCounter || 0;
            this.beaconReachedCounter = state.beaconReachedCounter || 0;
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