import React, { useEffect, useRef, useState } from 'react';
import './Canvas.css';

const Canvas = () => {
    const canvasRef = useRef(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const startPan = (e) => {
        setIsPanning(true);
        setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const panCanvas = (e) => {
        if (isPanning) {
            setPan({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
        }
    };

    const endPan = () => {
        setIsPanning(false);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const drawGrid = () => {
            const majorGridSize = 100;
            const intermediateGridSize = majorGridSize / 2;
            const minorGridSize = intermediateGridSize / 5;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(pan.x % majorGridSize, pan.y % majorGridSize);

            // Draw minor grid lines
            ctx.strokeStyle = '#e0e0e0';
            for (let x = -minorGridSize; x < canvas.width + minorGridSize; x += minorGridSize) {
                for (let y = -minorGridSize; y < canvas.height + minorGridSize; y += minorGridSize) {
                    ctx.strokeRect(x, y, minorGridSize, minorGridSize);
                }
            }

            // Draw intermediate grid lines
            ctx.strokeStyle = '#c0c0c0';
            for (let x = -intermediateGridSize; x < canvas.width + intermediateGridSize; x += intermediateGridSize) {
                for (let y = -intermediateGridSize; y < canvas.height + intermediateGridSize; y += intermediateGridSize) {
                    ctx.strokeRect(x, y, intermediateGridSize, intermediateGridSize);
                }
            }

            // Draw major grid lines
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            for (let x = -majorGridSize; x < canvas.width + majorGridSize; x += majorGridSize) {
                for (let y = -majorGridSize; y < canvas.height + majorGridSize; y += majorGridSize) {
                    ctx.strokeRect(x, y, majorGridSize, majorGridSize);
                }
            }

            ctx.restore();
        };

        drawGrid();
    }, [pan]);

    return (
        <canvas
            ref={canvasRef}
            className="drawing-canvas"
            width={window.innerWidth}
            height={window.innerHeight}
            onMouseDown={startPan}
            onMouseMove={panCanvas}
            onMouseUp={endPan}
            onMouseLeave={endPan}
        ></canvas>
    );
};

export default Canvas;