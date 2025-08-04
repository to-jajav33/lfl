import * as THREE from "three";

export function gen2DTextTexture(text: string, width: number, height: number, fontSize: number = 24, fontName: string = "Helvetica", fontWeight: string = "bold", scale: number = 1.0) {
    // use a canvas 2d to generate the label, then add to ThreeJS CanvasTexture. canvas should have transparent background
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    // calculate the size of the label
    const font = `${fontWeight} ${fontSize}px ${fontName}`;
    if (ctx) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.0)";
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = "rgba(255.0, 255.0, 255.0, 1.0)";
        ctx.font = font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.scale(scale, scale);
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    }

    return {
        canvas,
        texture: new THREE.CanvasTexture(canvas),
    };
}
