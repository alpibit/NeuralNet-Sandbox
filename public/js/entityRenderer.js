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
        this.ctx.drawImage(this.entityImage, this.x - this.radius, this.y - this.radius);
    }

    updateAngle(newAngle) {
        this.angle = newAngle;
    }

    updatePosition(dx, dy) {
        this.x += dx;
        this.y += dy;
        this.drawEntity();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    checkCollision(dx = 0, dy = 0) {
        // Ensure dx and dy are defined and are numbers
        if (typeof dx !== 'number' || typeof dy !== 'number') {
            console.error(`Invalid dx or dy: dx=${dx}, dy=${dy}`);
            return false;
        }

        let newX = this.x + dx;
        let newY = this.y + dy;

        // Clamp newX and newY to be within canvas boundaries
        newX = Math.max(0, Math.min(newX, this.canvas.width));
        newY = Math.max(0, Math.min(newY, this.canvas.height));

        // Calculate the dimensions for getImageData
        const size = this.radius * 2;
        const startX = Math.max(0, Math.round(newX - this.radius));
        const startY = Math.max(0, Math.round(newY - this.radius));

        // Adjust width and height to stay within canvas boundaries
        const width = Math.min(size, this.canvas.width - startX);
        const height = Math.min(size, this.canvas.height - startY);

        try {
            const imageData = this.ctx.getImageData(startX, startY, width, height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
                    console.log("collision detected");
                    return true;
                }
            }
        } catch (e) {
            console.error('Error in checkCollision:', e);
        }

        return false;
    }


    checkBeacon(dx = 0, dy = 0) {
        // Calculate new position based on dx and dy
        let newX = this.x + dx;
        let newY = this.y + dy;

        // Calculate the dimensions for getImageData
        const size = this.radius * 2;
        const startX = Math.max(0, Math.round(newX - this.radius));
        const startY = Math.max(0, Math.round(newY - this.radius));

        // Adjust width and height to stay within canvas boundaries
        const width = Math.min(size, this.canvas.width - startX);
        const height = Math.min(size, this.canvas.height - startY);

        try {
            const imageData = this.ctx.getImageData(startX, startY, width, height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 255) {
                    console.log("beacon collision detected");
                    return true;
                }
            }
        } catch (e) {
            console.error('Error in checkBeacon:', e);
        }

        return false;
    }

    resetToStartingPosition() {
        this.x = this.startingX;
        this.y = this.startingY;
        this.angle = 0;
        this.drawEntity();
    }
}
