class SensorControl {
    constructor(entityRenderer, sensorRange) {
        this.entityRenderer = entityRenderer;
        this.sensorRange = sensorRange;
        this.sensorData = {
            leftSensor: { distance: null, detected: false, type: null },
            rightSensor: { distance: null, detected: false, type: null }
        };

        this.lastUpdated = 0;
        this.updateInterval = 100;
    }

    // Update the sensor data if forceUpdate is true or if the update interval has passed
    updateSensorData(forceUpdate = false) {
        const currentTime = Date.now();
        if (forceUpdate || currentTime - this.lastUpdated > this.updateInterval) {
            this.sensorData.leftSensor = this.calculateSensorReading('left');
            this.sensorData.rightSensor = this.calculateSensorReading('right');
            this.lastUpdated = currentTime;
        }
    }

    // Get the current sensor data by updating it first
    getSensorData() {
        this.updateSensorData();
        return this.sensorData;
    }

    // Calculate the sensor reading for a given sensor side
    calculateSensorReading(sensorSide) {
        const sensorPosition = this.getSensorPosition(sensorSide);
        const angle = this.entityRenderer.angle;

        const angleRange = Math.PI / 12; // 15 degrees
        const samples = 5; // Number of samples within the range

        for (let i = 0; i < samples; i++) {
            const sampleAngle = angle - angleRange / 2 + i * (angleRange / (samples - 1));
            const { collision, distance, type } = this.checkForCollision(sensorPosition, sampleAngle);

            if (collision) {
                return { distance, detected: collision, type };
            }
        }

        return { distance: this.sensorRange, detected: false, type: null };
    }

    // Get the position of a sensor based on its side
    getSensorPosition(sensorSide) {
        const sensorDistance = 10; // Half the distance between sensors
        const angleOffset = (sensorSide === 'left' ? -1 : 1) * sensorDistance / this.entityRenderer.radius;

        const sensorAngle = this.entityRenderer.angle + angleOffset;

        const sensorX = this.entityRenderer.x + (this.entityRenderer.radius + 5) * Math.cos(sensorAngle);
        const sensorY = this.entityRenderer.y + (this.entityRenderer.radius + 5) * Math.sin(sensorAngle);

        return {
            x: sensorX,
            y: sensorY
        };
    }

    // Check for collision with the environment based on sensor position and angle
    checkForCollision(sensorPosition, angle) {
        const imageData = this.entityRenderer.ctx.getImageData(0, 0, this.entityRenderer.canvas.width, this.entityRenderer.canvas.height);
        const data = imageData.data;

        for (let i = 0; i < this.sensorRange; i++) {
            const x = Math.round(sensorPosition.x + i * Math.cos(angle));
            const y = Math.round(sensorPosition.y + i * Math.sin(angle));

            const index = (y * imageData.width + x) * 4;

            if (data[index] === 0 && data[index + 1] === 0 && data[index + 2] === 0) {
                return { collision: true, distance: i, type: 'wall' };
            }

            if (data[index] === 0 && data[index + 1] === 0 && data[index + 2] === 255) {
                return { collision: true, distance: i, type: 'beacon' };
            }
        }

        return { collision: false, distance: this.sensorRange, type: null };
    }

    // Process the sensor data and take appropriate action
    processSensorData() {
        if (this.sensorData.leftSensor.detected || this.sensorData.rightSensor.detected) {
            if (this.sensorData.leftSensor.type === 'beacon' || this.sensorData.rightSensor.type === 'beacon') {
                console.log("Beacon detected! Taking action.");
            } else if (this.sensorData.leftSensor.type === 'wall' || this.sensorData.rightSensor.type === 'wall') {
                console.log("Wall detected! Taking action.");
            }
        }
    }

    // Render the sensors on the canvas
    renderSensors() {
        this.renderSensor('left', this.sensorData.leftSensor.detected, this.sensorData.leftSensor.distance);
        this.renderSensor('right', this.sensorData.rightSensor.detected, this.sensorData.rightSensor.distance);
    }

    // Render a single sensor on the canvas
    renderSensor(side, detected, distance) {
        const sensorPosition = this.getSensorPosition(side);
        const angle = this.entityRenderer.angle;

        const greenEndX = sensorPosition.x + this.sensorRange * Math.cos(angle);
        const greenEndY = sensorPosition.y + this.sensorRange * Math.sin(angle);
        this.drawSensorLine(sensorPosition.x, sensorPosition.y, greenEndX, greenEndY, 'green');

        if (detected) {
            const redStartX = sensorPosition.x + distance * Math.cos(angle);
            const redStartY = sensorPosition.y + distance * Math.sin(angle);
            this.drawSensorLine(redStartX, redStartY, greenEndX, greenEndY, 'red');
        }
    }

    // Draw a line representing a sensor on the canvas
    drawSensorLine(startX, startY, endX, endY, color) {
        this.entityRenderer.ctx.beginPath();
        this.entityRenderer.ctx.moveTo(startX, startY);
        this.entityRenderer.ctx.lineTo(endX, endY);
        this.entityRenderer.ctx.strokeStyle = color;
        this.entityRenderer.ctx.stroke();
    }
}