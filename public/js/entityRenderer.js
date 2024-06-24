class EntityRenderer {
    constructor(canvasId, { x, y, image }) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.radius = 15;
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.entityImage = new Image();
        this.entityImage.src = image;
        this.startingX = x;
        this.startingY = y;

        this.imageLoaded = new Promise((resolve) => {
            this.entityImage.onload = resolve;
        });
    }

    async drawEntity() {
        await this.imageLoaded;
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.angle);
        this.ctx.drawImage(this.entityImage, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        this.ctx.restore();
    }

    updateAngle(newAngle) {
        this.angle = newAngle;
    }

    updatePosition(dx, dy) {
        this.x += dx;
        this.y += dy;
        console.log("Entity position updated to:", this.x, this.y);
        this.drawEntity();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    checkCollision(dx = 0, dy = 0) {
        let newX = this.x + dx;
        let newY = this.y + dy;

        newX = Math.max(0, Math.min(newX, this.canvas.width));
        newY = Math.max(0, Math.min(newY, this.canvas.height));

        const size = this.radius * 2;
        const startX = Math.max(0, Math.round(newX - this.radius));
        const startY = Math.max(0, Math.round(newY - this.radius));

        const width = Math.min(size, this.canvas.width - startX);
        const height = Math.min(size, this.canvas.height - startY);

        try {
            const imageData = this.ctx.getImageData(startX, startY, width, height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
                    console.log("Wall collision detected");
                    return true;
                }
                if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 255) {
                    console.log("Beacon collision detected");
                    return true; // Now treating beacon collisions the same as wall collisions
                }
            }
        } catch (e) {
            console.error('Error in checkCollision:', e);
        }

        return false;
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    resetToStartingPosition() {
        this.x = this.startingX;
        this.y = this.startingY;
        this.angle = 0;
        console.log("Entity reset to starting position:", this.x, this.y);
        this.drawEntity();
    }
}