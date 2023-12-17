// Preload images to ensure they are loaded before rendering
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

document.addEventListener('DOMContentLoaded', () => {
    const imagePaths = ['assets/map/map.png', 'assets/entity/entity.png'];

    // Preload images and initialize renderers and controls
    preloadImages(imagePaths).then(() => {
        const mapRenderer = new MapRenderer('simulationCanvas', 'assets/map/map.png');
        const entityRenderer = new EntityRenderer('simulationCanvas', { x: 400, y: 500, image: 'assets/entity/entity.png' });
        const sensorControl = new SensorControl(entityRenderer, 100);
        const entityControl = new EntityControl(entityRenderer);
        const entityAI = new EntityAI(entityRenderer, sensorControl, entityControl);
        const canvas = entityRenderer.canvas;

        // Main rendering and update loop
        setInterval(() => {
            entityRenderer.clearCanvas();
            mapRenderer.drawMap();

            // !!! Uncomment this section to enable beacons !!!

            // // Update beacon location if reached
            // if (beacon.isReached(entityRenderer.x, entityRenderer.y)) {
            //     const newX = Math.floor(Math.random() * (canvas.width - beacon.width));
            //     const newY = Math.floor(Math.random() * (canvas.height - beacon.height));
            //     beacon.setLocation(newX, newY);
            // }

            // beacon.render(entityRenderer.ctx); // Render the beacon
            entityRenderer.drawEntity();
            sensorControl.renderSensors();
            entityAI.startMonitoring();
            entityAI.update();
        }, 100); // Update every 100ms

        // Handle keyboard input for entity movement and rotation
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

            // Redraw everything after movement or rotation
            entityRenderer.clearCanvas();
            mapRenderer.drawMap();
            entityRenderer.drawEntity();
            sensorControl.renderSensors();
        });


        fetch('../src/api/loadState.php')
            .then(response => response.json())
            .then(data => {
                console.log(data);
                entityAI.loadState(data);
            });

        setInterval(() => {
            entityAI.saveState();
        }, 30000);

        function displayAIState() {
            const state = entityAI.getState();
            document.getElementById('stateData').textContent = JSON.stringify(state, null, 2);
        }

        setInterval(displayAIState, 1000);


    });


});