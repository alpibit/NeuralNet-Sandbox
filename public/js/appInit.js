// Preload images function
function preloadImages(imagePaths) {
    let promises = imagePaths.map((path) => {
        return new Promise((resolve) => {
            let img = new Image();
            img.onload = resolve;
            img.src = path;
        });
    });
    return Promise.all(promises);
}

// Function to initialize the simulation
function initializeSimulation() {
    const mapRenderer = new MapRenderer('simulationCanvas', 'assets/map/map.png');
    const entityRenderer = new EntityRenderer('simulationCanvas', { x: 400, y: 500, image: 'assets/entity/entity.png' });
    const sensorControl = new SensorControl(entityRenderer, 100);
    const entityControl = new EntityControl(entityRenderer);
    const neuralNetwork = new NeuralNetwork([4, 8, 8, 3], 0.01, 'relu');
    const entityAI = new EntityAI(entityRenderer, sensorControl, entityControl, neuralNetwork);
    const canvas = entityRenderer.canvas;

    // Create a beacon
    let beacon = new Beacon(400, 400);
    let beaconReachedTime = null;
    const beaconFarmingDuration = 3000; // 5 seconds in milliseconds

    // Start the AI monitoring process
    entityAI.startMonitoring();

    // Function to generate a new beacon location
    function generateNewBeaconLocation() {
        const padding = 50; // Padding from the edges of the canvas
        const newX = Math.floor(Math.random() * (canvas.width - beacon.width - 2 * padding)) + padding;
        const newY = Math.floor(Math.random() * (canvas.height - beacon.height - 2 * padding)) + padding;
        return { x: newX, y: newY };
    }

    // Main rendering and update loop
    function gameLoop(timestamp) {
        entityRenderer.clearCanvas();
        mapRenderer.drawMap();

        const entityPosition = entityRenderer.getPosition();

        // Check if beacon is reached
        if (beacon.isReached(entityPosition.x, entityPosition.y)) {
            if (beaconReachedTime === null) {
                beaconReachedTime = timestamp;
                console.log("Beacon reached at position:", beacon.x, beacon.y);
            }

            // Check if farming duration has passed
            if (timestamp - beaconReachedTime >= beaconFarmingDuration) {
                const newLocation = generateNewBeaconLocation();
                beacon.setLocation(newLocation.x, newLocation.y);
                console.log("Beacon relocated to:", beacon.x, beacon.y);
                entityAI.onBeaconRelocated(); // Notify AI that the beacon was relocated
                beaconReachedTime = null;
            } else {
                entityAI.onBeaconReached(); // Notify AI that a beacon is being farmed
            }
        } else {
            beaconReachedTime = null;
        }

        // Render beacon
        beacon.render(entityRenderer.ctx);

        entityRenderer.drawEntity();
        sensorControl.renderSensors();
        entityAI.update();

        requestAnimationFrame(gameLoop);
    }

    // Start the game loop
    requestAnimationFrame(gameLoop);

    // Handle keyboard input for manual entity control
    document.addEventListener('keydown', (event) => {
        const stepSize = 5; // 5 pixels
        const turnAngle = Math.PI / 18; // 10 degrees

        switch (event.key) {
            case 'ArrowUp':
                entityControl.moveForward(stepSize);
                break;
            case 'ArrowDown':
                entityControl.moveBackward(stepSize);
                break;
            case 'ArrowLeft':
                entityControl.turnLeft(turnAngle);
                break;
            case 'ArrowRight':
                entityControl.turnRight(turnAngle);
                break;
        }
    });

    // Load initial state
    fetch('../src/api/loadState.php')
        .then(response => response.json())
        .then(data => {
            console.log('Loaded state:', data);
            entityAI.loadState(data);
        })
        .catch(error => console.error('Error loading state:', error));

    // Periodically save state
    setInterval(() => {
        entityAI.saveState();
    }, 60000); // Save every minute

    // Display AI state and performance metrics
    function updateDisplay() {
        const state = entityAI.getState();
        const metrics = entityAI.getPerformanceMetrics();

        document.getElementById('stateData').textContent = JSON.stringify(state, null, 2);
        document.getElementById('metricsData').textContent = JSON.stringify(metrics, null, 2);
    }

    setInterval(updateDisplay, 1000); // Update display every second

    // Log performance metrics
    setInterval(() => {
        const metrics = entityAI.getPerformanceMetrics();
        console.log('AI Performance:', metrics);
    }, 60000); // Log every minute
}

// Main execution
document.addEventListener('DOMContentLoaded', () => {
    const imagePaths = ['assets/map/map.png', 'assets/entity/entity.png'];

    // Preload images, then initialize the simulation
    preloadImages(imagePaths).then(() => {
        initializeSimulation();
    }).catch(error => {
        console.error('Error preloading images:', error);
    });
});