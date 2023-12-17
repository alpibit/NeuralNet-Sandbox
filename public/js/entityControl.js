class EntityControl {
    constructor(entityRenderer) {
        this.entityRenderer = entityRenderer;
    }

    // Move the entity forward by a given distance
    moveForward(distance) {
        const dx = distance * Math.cos(this.entityRenderer.angle);
        const dy = distance * Math.sin(this.entityRenderer.angle);

        if (!this.entityRenderer.checkCollision(dx, dy) && !this.entityRenderer.checkBeacon(dx, dy)) {
            this.entityRenderer.updatePosition(dx, dy);
        } else {
            console.log("Collision prevented");
        }
    }

    // Move the entity backward by a given distance
    moveBackward(distance) {
        const dx = -distance * Math.cos(this.entityRenderer.angle);
        const dy = -distance * Math.sin(this.entityRenderer.angle);
        if (!this.entityRenderer.checkCollision(dx, dy) && !this.entityRenderer.checkBeacon(dx, dy)) {
            this.entityRenderer.updatePosition(dx, dy);
        } else {
            this.entityRenderer.resetToStartingPosition();
        }
    }

    // Turn the entity to the left by a given angle
    turnLeft(angle) {
        this.entityRenderer.updateAngle(this.entityRenderer.angle - angle);
    }

    // Turn the entity to the right by a given angle
    turnRight(angle) {
        this.entityRenderer.updateAngle(this.entityRenderer.angle + angle);
    }
}
