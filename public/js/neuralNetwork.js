class NeuralNetwork {
    constructor(layerSizes, learningRate = 0.01) {
        this.layerSizes = layerSizes;
        this.weights = [];
        this.biases = [];
        this.learningRate = learningRate;
        this.initNetwork();
    }

    // Initialize the network by creating random weights and biases
    initNetwork() {
        for (let i = 1; i < this.layerSizes.length; i++) {
            this.weights.push(this.createRandomArray(this.layerSizes[i] * this.layerSizes[i - 1]));
            this.biases.push(this.createRandomArray(this.layerSizes[i]));
        }
    }

    // Create an array of random numbers between -1 and 1
    createRandomArray(length) {
        return Array.from({ length }, () => Math.random() * 2 - 1);
    }

    // Perform feed-forward propagation through the network
    feedForward(inputArray) {
        let activations = inputArray;

        for (let layer = 0; layer < this.weights.length; layer++) {
            let newActivations = [];
            for (let i = 0; i < this.layerSizes[layer + 1]; i++) {
                let sum = this.biases[layer][i];
                for (let j = 0; j < this.layerSizes[layer]; j++) {
                    sum += this.weights[layer][i * this.layerSizes[layer] + j] * activations[j];
                }
                newActivations.push((layer === this.weights.length - 1) ? this.sigmoid(sum) : this.relu(sum));
            }
            activations = newActivations;
        }
        return activations;
    }

    // Perform backpropagation to update weights and biases
    backpropagate(inputs, targets) {
        // Forward pass
        let activations = [inputs];
        let weightedSums = [];

        for (let layer = 0; layer < this.weights.length; layer++) {
            let sum = new Array(this.layerSizes[layer + 1]).fill(0);
            for (let i = 0; i < this.layerSizes[layer + 1]; i++) {
                for (let j = 0; j < this.layerSizes[layer]; j++) {
                    sum[i] += this.weights[layer][i * this.layerSizes[layer] + j] * activations[layer][j];
                }
                sum[i] += this.biases[layer][i];
            }
            weightedSums.push(sum);
            activations.push(sum.map((s, index) => (layer === this.weights.length - 1) ? this.sigmoid(s) : this.relu(s)));
        }

        // Calculate error
        let output = activations[activations.length - 1];
        let errors = output.map((o, index) => targets[index] - o);

        // Backward pass
        for (let layer = this.weights.length - 1; layer >= 0; layer--) {
            let layerErrors = errors;
            errors = new Array(this.layerSizes[layer]).fill(0);

            // Calculate the gradient
            let gradients = layerErrors.map((error, index) => {
                let activation = activations[layer + 1][index];
                return error * ((layer === this.weights.length - 1) ? this.dSigmoid(activation) : this.dRelu(activation));
            });

            // Calculate deltas
            let deltas = new Array(this.weights[layer].length).fill(0);
            for (let i = 0; i < this.layerSizes[layer + 1]; i++) {
                for (let j = 0; j < this.layerSizes[layer]; j++) {
                    deltas[i * this.layerSizes[layer] + j] = gradients[i] * activations[layer][j];
                }
            }

            // Update weights and biases
            for (let i = 0; i < this.weights[layer].length; i++) {
                this.weights[layer][i] += deltas[i] * this.learningRate;
            }
            for (let i = 0; i < this.biases[layer].length; i++) {
                this.biases[layer][i] += gradients[i] * this.learningRate;
            }

            // Calculate errors for the previous layer
            for (let i = 0; i < this.layerSizes[layer]; i++) {
                for (let j = 0; j < this.layerSizes[layer + 1]; j++) {
                    errors[i] += layerErrors[j] * this.weights[layer][j * this.layerSizes[layer] + i];
                }
            }
        }
    }

    // Train the neural network using backpropagation
    train(data, epochs) {
        for (let e = 0; e < epochs; e++) {
            data.forEach(datum => {
                this.backpropagate(datum.inputs, datum.targets);
            });
        }
    }

    // Export the current state of the neural network
    exportState() {
        return {
            weights: this.weights,
            biases: this.biases
        };
    }

    // Import a previously exported state of the neural network
    importState(state) {
        if (state.weights && state.biases) {
            this.weights = state.weights;
            this.biases = state.biases;
        } else {
            console.error('Invalid state structure:', state);
        }
    }

    // Sigmoid activation function
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    // ReLU activation function
    relu(x) {
        return Math.max(0, x);
    }

    // Derivative of the sigmoid activation function
    dSigmoid(x) {
        return x * (1 - x);
    }

    // Derivative of the ReLU activation function
    dRelu(x) {
        return x > 0 ? 1 : 0;
    }
}
