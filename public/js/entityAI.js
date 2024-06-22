class EntityAI {
    constructor(entityRenderer, sensorControl, entityControl, neuralNetwork) {
        this.entityRenderer = entityRenderer;
        this.sensorControl = sensorControl;
        this.entityControl = entityControl;
        this.brain = neuralNetwork || new NeuralNetwork([4, 6, 3]);

        this.previousState = null;
        this.epsilon = 0.1; // Exploration rate
        this.lastActionTime = Date.now();
        this.lastUniqueActionTime = Date.now();
        this.lastUniqueAction = null;
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
    }

    startMonitoring() {
        setInterval(() => {
            if (this.isRepetitiveOrInactive()) {
                if (this.debug) {
                    console.log('Asynchronous Monitoring: Negative Rewarding for Repetition or Inactivity...');
                }
                let reward = [-1, 0, 0];
                this.brain.train([{ inputs: this.previousState?.inputArray, targets: reward }], 1);
                this.updateAverageReward(reward[0]);
            }
        }, 5000); // Check every 5 seconds
    }

    update() {
        const currentTime = Date.now();
        const sensorData = this.sensorControl.getSensorData();
        const inputArray = this.normalizeSensorData(sensorData);

        // Epsilon-greedy strategy
        if (Math.random() < this.epsilon) {
            // Exploration: Random action
            this.takeRandomAction();
        } else {
            // Exploitation: Use neural network for decision
            const decision = this.brain.feedForward(inputArray);
            if (this.debug) {
                console.log("inputArray: ", inputArray);
                console.log("decision: ", decision);
            }
            this.previousState = { inputArray, decision, action: this.lastAction };
            this.makeDecision(decision);
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

    makeDecision(decision) {
        let actionTaken = false;
        let currentAction = null;

        if (decision[0] > 0.5) {
            this.entityControl.moveForward(5);
            actionTaken = true;
            currentAction = 'moveForward';
        }
        if (decision[1] > 0.5) {
            this.entityControl.turnLeft(Math.PI / 18);
            actionTaken = true;
            currentAction = 'turnLeft';
        }
        if (decision[2] > 0.5) {
            this.entityControl.turnRight(Math.PI / 18);
            actionTaken = true;
            currentAction = 'turnRight';
        }

        this.updateActionHistory(currentAction);
        if (actionTaken) {
            this.lastActionTime = Date.now();
            this.evaluateOutcome();
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
        this.evaluateOutcome();
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

        // Check if the entity is close to a beacon and active
        const isNearBeacon = (currentSensorData.leftSensor.type === 'beacon' && currentSensorData.leftSensor.distance < 10) ||
            (currentSensorData.rightSensor.type === 'beacon' && currentSensorData.rightSensor.distance < 10);

        if (this.isRepetitiveOrInactive() && !isNearBeacon) {
            if (this.debug) {
                console.log('Negative Rewarding for Repetition or Inactivity...');
            }
            reward = [-1, 0, 0];
        }

        this.brain.train([{ inputs: this.previousState.inputArray, targets: reward }], 1);
        this.updateAverageReward(reward[0]);
    }

    calculateReward(sensorData) {
        let reward = [0, 0, 0];

        // Reward for exploring new areas
        if (this.exploredAreas.size % 10 === 0) {
            reward[0] += 0.2;
            if (this.debug) console.log("Positive reward for exploration");
        }

        // Penalty for collisions
        if (this.entityRenderer.checkCollision()) {
            reward[0] -= 1;
            this.collisionCounter++;
            if (this.debug) console.log("Negative reward for collision");
        }

        // Reward for reaching beacons
        if ((sensorData.leftSensor.type === 'beacon' && sensorData.leftSensor.distance < 5) ||
            (sensorData.rightSensor.type === 'beacon' && sensorData.rightSensor.distance < 5)) {
            reward[0] += 1;
            this.beaconReachedCounter++;
            if (this.debug) console.log("Positive reward for reaching beacon");
        }

        // Penalty for staying stationary or moving in circles
        if (this.stationaryCounter > 10 || this.isMovingInCircles()) {
            reward[0] -= 0.5;
            if (this.debug) console.log("Negative reward for inactivity or circular movement");
        }

        // Slight penalty for being too close to a wall without collision
        if ((sensorData.leftSensor.type === 'wall' && sensorData.leftSensor.distance < 10) ||
            (sensorData.rightSensor.type === 'wall' && sensorData.rightSensor.distance < 10)) {
            reward[0] -= 0.2;
            if (this.debug) console.log("Small negative reward for being close to a wall");
        }

        return reward;
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
            averageReward: this.calculateAverageReward()
        };
    }

    calculateAverageReward() {
        return this.rewardCount > 0 ? this.totalReward / this.rewardCount : 0;
    }

    saveState() {
        for (let layer = 0; layer < this.brain.weights.length; layer++) {
            this.saveLayerState(layer, 'weight', this.brain.weights[layer]);
            this.saveLayerState(layer, 'bias', this.brain.biases[layer]);
        }
    }

    saveLayerState(layer, type, data) {
        const state = {
            layer: layer,
            type: type,
            data: data
        };

        fetch('../src/api/saveState.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
        })
            .then(response => response.json())
            .then(data => console.log(`State saved successfully for layer ${layer}, type ${type}`, data))
            .catch(error => console.error('Error saving state', error));
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
        } else {
            console.error('Invalid state structure:', state);
        }
    }

    getState() {
        return {
            weights: this.brain.weights,
            biases: this.brain.biases
        };
    }
}