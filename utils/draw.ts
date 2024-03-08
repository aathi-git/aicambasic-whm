import { DetectedObject, ObjectDetection } from "@tensorflow-models/coco-ssd";
import { cx } from "class-variance-authority";



// mirrored, predications, canvasRef.current?.getContext('2d')
export function drawOnCanvas(    
    mirrored: Boolean,
    predictions: DetectedObject[],
    ctx: CanvasRenderingContext2D | null | undefined
    ){
        predictions.forEach((detectObject: DetectedObject)=>{
            const { class: name, bbox, score} = detectObject;
            const [x, y, width, height] = bbox;

            if (ctx) {
                ctx.beginPath();

                
                ctx.fillStyle = name === 'person' ? '#FF0F0F' : '#00B612';
                ctx.globalAlpha = 0.4;

                ctx.roundRect(x, y, width, height, 8);

                ctx.fill()

                ctx.font = "12px Courier New";
                ctx.globalAlpha = 1

                ctx.fillText(name, x, y);
            }
        })

}