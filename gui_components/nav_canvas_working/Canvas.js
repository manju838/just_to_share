import React, { useEffect, useRef, useState } from 'react';
import './Canvas.css';

const Canvas = ({ isDrawing }) => {

     /*
    useState(): Hook to add a state variable to your component.
    useRef(): Hook to reference a value that’s not needed for rendering
    useEffect(): Hook to synchronize a component with an external system.(control a non-React component based on the React state)

    => If a React event object is returned by the eventhandler, it is a "Synthetic Event".(Eg: MouseEvent, DragEvent, KeyboardEvent, PointerEvent, TouchEvent)

    1) https://react.dev/reference/react-dom/components/common#handling-pointer-events
    2) https://www.w3schools.com/jsref/event_onmouseover.asp


    The following are explanations for common mouseevents:

    <div
    onClick={e => console.log('Executes fn when clicked')}
    onMouseEnter={e => console.log('Fires when the pointer moves inside an element')}
    onMouseLeave={e => console.log('Fires when the pointer leaves an element')}
    onMouseDown={e => console.log('Fires when the pointer is pressed down')}◘
    onMouseUp={e => console.log('Fires when the pointer is released')}
    onMouseOver={e => console.log('Fires when pointer is moved over an element')}
    onDoubleClick={e=> console.log('Fires when pointer clicked twice')}
    />

    */
 
    const canvasRef = useRef(null); // A null reference to canvas
    const [pan, setPan] = useState({ x: 0, y: 0 }); // State variable to store  panning offset in the x and y directions
    const [isPanning, setIsPanning] = useState(false); // Track if user is panning 
    const [startPos, setStartPos] = useState({ x: 0, y: 0 }); // state variable to store the initial position where the user started panning, helping to calculate the new position as they drag.
    const [lines, setLines] = useState([]); // State to store drawn lines
    const [currentLine, setCurrentLine] = useState(null); // State to track the current line being drawn

    const startPan = (e) => {
        /* Triggered when the user clicks down on the canvas */
        if (!isDrawing) {
            setIsPanning(true);
            setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y }); //clientx and clienty are horizontal and vertical coordinate within the application's viewport (https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/clientX)
        }
    };

    const panCanvas = (e) => {
        /* Triggered when the user moves the mouse while holding down the click */
        if (isPanning) {
            setPan({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
        }
    };

    const endPan = () => {
         /* Triggered when the user releases the mouse button or leaves the canvas area */
        setIsPanning(false);
    };

    // Function to snap cursor location(x,y) to the nearest grid point, whether major, intermediate, or minor
    const snapToGrid = (x, y) => {

        const majorGridSize = 100;
        const intermediateGridSize = majorGridSize / 2; // 50
        const minorGridSize = intermediateGridSize / 5; // 10

        const snapMajorX = Math.round(x / majorGridSize) * majorGridSize;
        const snapMajorY = Math.round(y / majorGridSize) * majorGridSize;

        const snapIntermediateX = Math.round(x / intermediateGridSize) * intermediateGridSize;
        const snapIntermediateY = Math.round(y / intermediateGridSize) * intermediateGridSize;

        const snapMinorX = Math.round(x / minorGridSize) * minorGridSize;
        const snapMinorY = Math.round(y / minorGridSize) * minorGridSize;
        
        // Calculate euclidean distance between cursor(x,y) and three grids
        const distToMajor = Math.hypot(snapMajorX - x, snapMajorY - y);
        const distToIntermediate = Math.hypot(snapIntermediateX - x, snapIntermediateY - y);
        const distToMinor = Math.hypot(snapMinorX - x, snapMinorY - y);

        // If major grid is closest
        if (distToMajor <= distToIntermediate && distToMajor <= distToMinor) 
        {
            return { x: snapMajorX, y: snapMajorY };
        } 
        // If intermediate grid is closest
        else if (distToIntermediate <= distToMinor) 
        {
            return { x: snapIntermediateX, y: snapIntermediateY };
        } 
        // If minor grid is closest
        else 
        {
            return { x: snapMinorX, y: snapMinorY };
        }
    };

    const startDrawing = (e) => {
        if (isDrawing) {
            const { x, y } = snapToGrid(e.clientX - pan.x, e.clientY - pan.y);
            setCurrentLine({ startX: x, startY: y, endX: x, endY: y });
        }
    };

    const drawLine = (e) => {
        if (isDrawing && currentLine) {
            const { x, y } = snapToGrid(e.clientX - pan.x, e.clientY - pan.y);
            setCurrentLine({ ...currentLine, endX: x, endY: y });
        }
    };

    const finishDrawing = () => {
        if (isDrawing && currentLine) {
            setLines([...lines, currentLine]);
            setCurrentLine(null);
        }
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

        const drawAllLines = () => {
            lines.forEach(line => {
                ctx.beginPath();
                ctx.moveTo(line.startX + pan.x, line.startY + pan.y);
                ctx.lineTo(line.endX + pan.x, line.endY + pan.y);
                ctx.stroke();
            });

            if (currentLine) {
                ctx.beginPath();
                ctx.moveTo(currentLine.startX + pan.x, currentLine.startY + pan.y);
                ctx.lineTo(currentLine.endX + pan.x, currentLine.endY + pan.y);
                ctx.stroke();
            }
        };

        drawGrid();
        drawAllLines();

    }, [pan, lines, currentLine]);

    return (
        <canvas
            ref={canvasRef}
            className="drawing-canvas"
            width={window.innerWidth}
            height={window.innerHeight}
            onMouseDown={isDrawing ? startDrawing : startPan}
            onMouseMove={isDrawing ? drawLine : panCanvas}
            onMouseUp={isDrawing ? finishDrawing : endPan}
            onMouseLeave={endPan}
        ></canvas>
    );
};

export default Canvas;
