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
        // Entity is considered to have reached the beacon if it is within or touching the beacon's area
        const reached = (
            entityX + 15 >= this.x &&
            entityX - 15 <= this.x + this.width &&
            entityY + 15 >= this.y &&
            entityY - 15 <= this.y + this.height
        );
        if (reached) {
            console.log("Beacon reached check: true");
        }
        return reached;
    }

    setLocation(x, y) {
        // Set a new location for the beacon
        this.x = x;
        this.y = y;
        console.log("Beacon location set to:", x, y);
    }
}