class EntityAI {
    constructor(entityRenderer, sensorControl, entityControl, neuralNetwork) {
        this.entityRenderer = entityRenderer;
        this.sensorControl = sensorControl;
        this.entityControl = entityControl;
        this.brain = neuralNetwork || new NeuralNetwork([4, 6, 3]);

        this.previousState = null;
        this.epsilon = 0.1; // Exploration rate
        this.lastActionTime = Date.now(); // Track the last time an action was made
        this.lastUniqueActionTime = Date.now(); // Track the last time a unique action was made
        this.lastUniqueAction = null; // Store the last unique action
        this.actionHistory = []; // Track the history of actions
        this.actionCooldown = 5000; // Time in milliseconds to trigger exploration
        this.debug = true; // Set to true to enable debug messages
    }

    startMonitoring() {
        setInterval(() => {
            if (this.isRepetitiveOrInactive()) {
                if (this.debug) {
                    console.log('Asynchronous Monitoring: Negative Rewarding for Repetition or Inactivity...');
                }
                let reward = [-1, 0, 0];
                this.brain.train([{ inputs: this.previousState?.inputArray, targets: reward }], 1);
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
            if (this.actionHistory.length > 10) {
                this.actionHistory.shift();
            }
        }
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
    }

    findMostCommonAction(actions) {
        const count = actions.reduce((acc, action) => {
            acc[action] = (acc[action] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(count).reduce((a, b) => count[a] > count[b] ? a : b);
    }

    isRepetitiveOrInactive() {
        const currentTime = Date.now();
        const timeThreshold = 5000; // Adjusted to 5 seconds
        if (this.actionHistory.length === 0 || (currentTime - this.lastActionTime) > timeThreshold) {
            return true; // Inactive if no actions or last action was long ago
        }

        // Check if the last 5 actions are the same
        const recentActions = this.actionHistory.slice(-5); // Last 5 actions
        const mostCommonAction = this.findMostCommonAction(recentActions);
        const repetitionThreshold = 0.6; // 60% of actions are the same
        const isRepetitive = recentActions.filter(action => action === mostCommonAction).length / recentActions.length > repetitionThreshold;

        return isRepetitive;
    }

    calculateReward(sensorData) {
        let reward = [0, 0, 0];

        // Check if the entity has collided with a wall
        if (this.entityRenderer.checkCollision()) {
            reward = [-1, 0, 0]; // Heavy penalty for collision
        }
        // Check if the entity is close to a beacon
        else if ((sensorData.leftSensor.type === 'beacon' && sensorData.leftSensor.distance < 10) ||
            (sensorData.rightSensor.type === 'beacon' && sensorData.rightSensor.distance < 10)) {
            reward = [1, 0, 0]; // Positive reward for nearing a beacon
            if (this.debug) {
                console.log("Positive Reward for nearing a beacon");
            };
        }
        // Positive reward for safe navigation (no obstacles detected)
        else if (!sensorData.leftSensor.detected && !sensorData.rightSensor.detected) {
            reward = [0.1, 0, 0]; // Minor reward for avoiding obstacles
        }
        // Slight penalty for being too close to a wall without collision
        else if ((sensorData.leftSensor.type === 'wall' && sensorData.leftSensor.distance < 10) ||
            (sensorData.rightSensor.type === 'wall' && sensorData.rightSensor.distance < 10)) {
            reward = [-0.5, 0, 0];
            if (this.debug) {
                console.log("Negative Reward for being too close to a wall");
            };
        }

        return reward;
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
