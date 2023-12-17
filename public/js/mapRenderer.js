class MapRenderer {
    constructor(canvasId, mapImageSrc) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.mapImage = new Image();
        this.mapImage.src = mapImageSrc;

        this.mapImage.onload = () => {
            this.drawImage();
        };
    }

    drawImage() {
        this.ctx.drawImage(this.mapImage, 0, 0, this.canvas.width, this.canvas.height);
    }

    drawMap() {
        if (this.mapImage.complete) {
            this.drawImage();
        }
    }
}
