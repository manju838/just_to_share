import React, { useEffect, useRef, useState } from 'react';
import './Canvas.css';

const Canvas = ({ isDrawing, isMoving, isDelete }) => {
    //////////////////////// State Management ////////////////////////

    //////// Variable Type1: Canvas Reference ////////
    const canvasRef = useRef(null);

    //////// Variable Type2: Panning ////////
    const [pan, setPan] = useState({ x: 0, y: 0 }); // State to store the panning offset
    const [isPanning, setIsPanning] = useState(false); // State to track if the user is panning
    const [startPos, setStartPos] = useState({ x: 0, y: 0 }); // State to store the initial position where panning starts

    //////// Variable Type3: Zooming ////////
    const [zoom, setZoom] = useState(1); // State to manage zoom level

    //////// Variable Type4: Dots ////////
    const [dots, setDots] = useState([]);  // State to store the dots in grid coordinates
    const [draggingDot, setDraggingDot] = useState(null); // State to track the dot being dragged

    //////// Variable Type5: Grid Definitions ////////
    /* 
    Meter version: Major grid divided into 10 minor grids 
    */
    const majorGridSize = 100;
    const minorGridSize = majorGridSize / 10;

    //////////////////////// Utility fns. ////////////////////////
    
    //////// Utility fns. Type1: Panning ////////
    const startPan = (e) => {
        // Function to start panning
        if (!isDrawing) {  // Disable panning when in Draw Wall mode
            setIsPanning(true);
            setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
        else if (!isMoving){

        }
        else if (!isDelete){

        }
    };

    const panCanvas = (e) => {
        // Function to pan the canvas
        if (isPanning) {
            setPan({
                x: e.clientX - startPos.x,
                y: e.clientY - startPos.y,
            });
        }
    };

    const endPan = () => {
        // Function to end panning
        setIsPanning(false);
    };

    //////// Utility fns. Type2: Zooming ////////

    const handleZoom = (e) => {
        // Function to handle zooming
        e.preventDefault(); //stop the default scrolling behavior of the browser when the user scrolls, ensuring that the zoom action only affects your canvas.
        const zoomFactor = 1.1; // Each scroll will increase or decrease the zoom by 10%.
        const newZoom = e.deltaY > 0 ? zoom / zoomFactor : zoom * zoomFactor; // e.deltaY is vertical scroll amount, if it is greater than 0 then it is zoom out

        if (newZoom >= 0.9 && newZoom <= 1.5) {
            setZoom(newZoom);
        }
    };

    const calculateGridCoordinates = (x, y) => {
        // Function to calculate grid coordinates based on mouse position and current pan/zoom
        const adjustedX = (x - pan.x) / zoom;
        const adjustedY = (y - pan.y) / zoom;

        const snappedX = Math.round(adjustedX / minorGridSize) * minorGridSize;
        const snappedY = Math.round(adjustedY / minorGridSize) * minorGridSize;

        return { x: snappedX, y: snappedY };
    };

    const handleCanvasClick = (e) => {
        // Function to handle mouse click on the canvas
        if (isDrawing) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const { x: gridX, y: gridY } = calculateGridCoordinates(x, y);

            setDots([...dots, { x: gridX, y: gridY }]); // Add new dot to state in grid coordinates
        }
    };

    const startDragDot = (index) => (e) => {
        // Function to start dragging a dot
        if (isDrawing) {
            setDraggingDot(index);
        }
    };

    const dragDot = (e) => {
        // Function to drag a dot
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

    const endDragDot = () => {
        // Function to end dragging a dot
        setDraggingDot(null);
    };

    const toScreenCoordinates = (x, y) => {
        // Function to convert grid coordinates to screen coordinates
        return {
            x: (x * zoom) + pan.x,
            y: (y * zoom) + pan.y,
        };
    };

    //////////////////////// Handling Side Effects ////////////////////////

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
