class EntityControl {
    constructor(entityRenderer) {
        this.entityRenderer = entityRenderer;
    }

    moveForward(distance) {
        const dx = distance * Math.cos(this.entityRenderer.angle);
        const dy = distance * Math.sin(this.entityRenderer.angle);

        if (!this.entityRenderer.checkCollision(dx, dy)) {
            this.entityRenderer.updatePosition(dx, dy);
        } else {
            console.log("Collision detected");
        }
    }

    moveBackward(distance) {
        const dx = -distance * Math.cos(this.entityRenderer.angle);
        const dy = -distance * Math.sin(this.entityRenderer.angle);

        if (!this.entityRenderer.checkCollision(dx, dy)) {
            this.entityRenderer.updatePosition(dx, dy);
        } else {
            console.log("Collision detected");
            this.entityRenderer.resetToStartingPosition();
        }
    }

    turnLeft(angle) {
        this.entityRenderer.updateAngle(this.entityRenderer.angle - angle);
    }

    turnRight(angle) {
        this.entityRenderer.updateAngle(this.entityRenderer.angle + angle);
    }
}