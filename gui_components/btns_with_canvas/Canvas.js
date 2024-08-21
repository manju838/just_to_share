import React, { useEffect, useRef, useState } from 'react';
import './Canvas.css';

const Canvas = ({ isDrawing }) => {
    const canvasRef = useRef(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [dots, setDots] = useState([]);  // State to store the dots in grid coordinates
    const [draggingDot, setDraggingDot] = useState(null); // State to track the dot being dragged

    const majorGridSize = 100;
    const minorGridSize = majorGridSize / 10;

    // Function to start panning
    const startPan = (e) => {
        if (!isDrawing) {  // Disable panning when in Draw Wall mode
            setIsPanning(true);
            setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    // Function to pan the canvas
    const panCanvas = (e) => {
        if (isPanning) {
            setPan({
                x: e.clientX - startPos.x,
                y: e.clientY - startPos.y,
            });
        }
    };

    // Function to end panning
    const endPan = () => {
        setIsPanning(false);
    };

    // Function to handle zooming
    const handleZoom = (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const newZoom = e.deltaY > 0 ? zoom / zoomFactor : zoom * zoomFactor;

        if (newZoom >= 0.5 && newZoom <= 3) {
            setZoom(newZoom);
        }
    };

    // Function to calculate grid coordinates based on mouse position and current pan/zoom
    const calculateGridCoordinates = (x, y) => {
        const adjustedX = (x - pan.x) / zoom;
        const adjustedY = (y - pan.y) / zoom;

        const snappedX = Math.round(adjustedX / minorGridSize) * minorGridSize;
        const snappedY = Math.round(adjustedY / minorGridSize) * minorGridSize;

        return { x: snappedX, y: snappedY };
    };

    // Function to handle mouse click on the canvas
    const handleCanvasClick = (e) => {
        if (isDrawing) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const { x: gridX, y: gridY } = calculateGridCoordinates(x, y);

            setDots([...dots, { x: gridX, y: gridY }]); // Add new dot to state in grid coordinates
        }
    };

    // Function to start dragging a dot
    const startDragDot = (index) => (e) => {
        if (isDrawing) {
            setDraggingDot(index);
        }
    };

    // Function to drag a dot
    const dragDot = (e) => {
        if (draggingDot !== null) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const { x: gridX, y: gridY } = calculateGridCoordinates(x, y);

            const newDots = dots.map((dot, index) => (
                index === draggingDot ? { x: gridX, y: gridY } : dot
            ));

            setDots(newDots);
        }
    };

    // Function to end dragging a dot
    const endDragDot = () => {
        setDraggingDot(null);
    };

    // Function to convert grid coordinates to screen coordinates
    const toScreenCoordinates = (x, y) => {
        return {
            x: (x * zoom) + pan.x,
            y: (y * zoom) + pan.y,
        };
    };

    // useEffect hook to handle the drawing of the grid and dots
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const drawGrid = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.scale(zoom, zoom);
            ctx.translate(pan.x / zoom % majorGridSize, pan.y / zoom % majorGridSize);

            // Draw minor grid lines
            ctx.strokeStyle = '#e0e0e0';
            for (let x = -minorGridSize; x < canvas.width / zoom + minorGridSize; x += minorGridSize) {
                for (let y = -minorGridSize; y < canvas.height / zoom + minorGridSize; y += minorGridSize) {
                    ctx.strokeRect(x, y, minorGridSize, minorGridSize);
                }
            }

            // Draw major grid lines
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            for (let x = -majorGridSize; x < canvas.width / zoom + majorGridSize; x += majorGridSize) {
                for (let y = -majorGridSize; y < canvas.height / zoom + majorGridSize; y += majorGridSize) {
                    ctx.strokeRect(x, y, majorGridSize, majorGridSize);
                }
            }

            ctx.restore();

            // Draw the dots
            dots.forEach(dot => {
                const screenCoords = toScreenCoordinates(dot.x, dot.y);
                drawDot(ctx, screenCoords.x, screenCoords.y);
            });
        };

        const drawDot = (ctx, x, y) => {
            const dotSize = 2 / zoom; // Adjust dot size with zoom level
        
            // Draw the border
            ctx.beginPath();
            ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
            ctx.fillStyle = 'blue';  // Dot fill color
            ctx.strokeStyle = 'black'; // Dot border color
            ctx.lineWidth = 2 / zoom; // Border width that scales with zoom
            ctx.fill();
            ctx.stroke(); // Apply the border
            ctx.closePath();
        };
        

        drawGrid();
    }, [pan, zoom, dots]);

    return (
        <canvas
            ref={canvasRef}
            className="drawing-canvas"
            width={window.innerWidth}
            height={window.innerHeight}
            onMouseDown={isDrawing ? handleCanvasClick : startPan}
            onMouseMove={isDrawing ? dragDot : panCanvas}
            onMouseUp={endPan}
            onMouseLeave={endPan}
            onWheel={handleZoom}
        ></canvas>
    );
};

export default Canvas;
