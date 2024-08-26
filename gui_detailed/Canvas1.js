import React, { useEffect, useRef, useState } from 'react';
import './Canvas.css';
import Graph from 'graph-data-structure';

/* Pan+zoom+ drawing canvas only */

const Canvas = ({ isDrawing, isMoving, isDelete }) => {
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

    //////////////////////// State Management ////////////////////////

    //////// Variable Type1: Canvas Reference ////////
    const canvasRef = useRef(null);

    //////// Variable Type2: Panning ////////
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    //////// Variable Type3: Zooming ////////
    const [zoom, setZoom] = useState(1); // State to manage zoom level
    
    //////// Variable Type3: Zooming ////////
    const [dots, setDots] = useState([]); // State to manage dots
    const [lines, setLines] = useState([]); // State to manage lines

    const [draggingDot, setDraggingDot] = useState(null);
    const [hoveredDot, setHoveredDot] = useState(null);

    //////// Variable Type: Graph with all node and edge info ////////
    const [graph, setGraph] = useState({ nodes: {}, edges: [] });  // Initialize graph state


    //////// Variable Type: Grid Definitions ////////
    /* 
    Meter version: Major grid divided into 10 minor grids 
    */
    const majorGridSize = 100;
    const minorGridSize = majorGridSize / 10;

    //////////////////////// Utility fns. ////////////////////////
    
    //////// Utility fns. Type1: Panning ////////
    const startPan = (e) => {
        // Function to start panning
        if (!(isDrawing || isMoving || isDelete)) {  // Disable panning when any button is active
            setIsPanning(true);
            setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y }); //clientx and clienty are horizontal and vertical coordinate within the application's viewport (https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/clientX)
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

    //////// Utility fns. Type: Panning ////////

    const calculateGridCoordinates = (x, y) => {
        const adjustedX = (x - pan.x) / zoom;
        const adjustedY = (y - pan.y) / zoom;

        const snappedX = Math.round(adjustedX / minorGridSize) * minorGridSize;
        const snappedY = Math.round(adjustedY / minorGridSize) * minorGridSize;

        return { x: snappedX, y: snappedY };
    };

    const handleMouseMove = (e) => {
        if (isDrawing && draggingDot === null) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const { x: gridX, y: gridY } = calculateGridCoordinates(x, y);
            setHoveredDot(dots.findIndex(dot => dot.x === gridX && dot.y === gridY));
        }
        dragDot(e);
        panCanvas(e);
    };

    const dragDot = (e) => {
        if (draggingDot !== null) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const { x: gridX, y: gridY } = calculateGridCoordinates(x, y);

            const newDots = dots.map((dot, index) => (
                index === draggingDot ? { x: gridX, y: gridY } : dot
            ));

            const newLines = lines.map((line, index) => {
                if (index === draggingDot - 1) {
                    return { start: newDots[draggingDot - 1], end: newDots[draggingDot] };
                }
                if (index === draggingDot) {
                    return { start: newDots[draggingDot], end: newDots[draggingDot + 1] };
                }
                return line;
            });

            const newGraph = { ...graph };
            const nodeId = draggingDot + 1;  // Node IDs are 1-based
            newGraph.nodes[nodeId] = { x: gridX, y: gridY };

            setDots(newDots);
            setLines(newLines);
            setGraph(newGraph);
        }
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

     //////////////////////// Handling Side Effects ////////////////////////
    /*
    The useEffect hook is used to perform side effects in your functional components, such as fetching data, subscribing to external events, or manually changing the DOM.
    useEffect(() => {setup}, [optional dependencies]);

    Starter Tutorial: https://www.youtube.com/watch?v=-4XpG5_Lj_o

    Note: Same file has multiple useEffect fns, managing different side effects
    */
    
    useEffect(() => {
        // Code in this curly braces gets executed once at beginning and whenever the dependency array is satisfied.

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d'); // returns a drawing context on the canvas (It can be "2d", "webgl", "webgl2", "webgpu", "bitmaprenderer")
        
        const drawGrid = () => {
            /*
            clearRect(left_pt_x_coordinate,left_pt_y_coordinate, width, height): erases the pixels in a rectangular area by setting them to transparent black.
            strokestyle(left_pt_x_coordinate,left_pt_y_coordinate, width, height): specifies the color, gradient, or pattern to use for the strokes (outlines) around shapes
            strokerect(left_pt_x_coordinate,left_pt_y_coordinate, width, height): draws a rectangle that is stroked (outlined) according to the current strokeStyle
            */

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.scale(zoom, zoom);
            ctx.translate(pan.x / zoom % majorGridSize, pan.y / zoom % majorGridSize);

            // Draw the canvas
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

            ctx.restore(); // restores the state of a saved drawing context

        };

        // Function Calls
        drawGrid();

        
    }, [pan, zoom]);

    

    return (
        <canvas
            ref={canvasRef}
            className="drawing-canvas"
            width={window.innerWidth}
            height={window.innerHeight}
            onMouseDown={startPan}
            onMouseUp={endPan}
            onMouseLeave={endPan}
            onWheel={handleZoom}
            onMouseMove={handleMouseMove}

        />
    );
};

export default Canvas;

/* 
onMouseDown={startPan}         => Clicking mouse starts pan
onMouseUp={endPan}             => Releasing mouse ends pan
onMouseLeave={endPan}          => Pointer leaves the element, here canvas (ends pan operation if mouse comes out of canvas)
onClick={handleCanvasClick}    => Draw Wall link
onWheel={handleZoom}           => Zooming link
onMouseMove={handleMouseMove}  => Panning link

Canvas "onMouseMove" is triggered whenever the mouse moves
*/
