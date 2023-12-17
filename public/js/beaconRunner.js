class Beacon {
    constructor(x, y, width = 30, height = 30, color = 'rgb(0, 0, 255)') {
        this.x = x;             // X-coordinate of the beacon
        this.y = y;             // Y-coordinate of the beacon
        this.width = width;     // Width of the beacon
        this.height = height;   // Height of the beacon
        this.color = color;     // Color of the beacon
    }

    render(ctx) {
        // Render the beacon on the canvas
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    isReached(entityX, entityY) {
        // Check if the entity has reached the beacon
        // Simple check: entity is considered to have reached the beacon if it is within the beacon's area
        return (
            entityX >= this.x &&
            entityX <= this.x + this.width &&
            entityY >= this.y &&
            entityY <= this.y + this.height
        );
    }

    setLocation(x, y) {
        // Set a new location for the beacon
        this.x = x;
        this.y = y;
    }
}
