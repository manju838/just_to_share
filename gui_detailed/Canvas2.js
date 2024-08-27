import React, { useEffect, useRef, useState } from 'react';
import './Canvas.css';
import Graph from 'graph-data-structure';

/* Dragging point working */

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
    const canvasRef = useRef(null); // A reference to the canvas element.

    //////// Variable Type2: Panning ////////
    const [pan, setPan] = useState({ x: 0, y: 0 }); // State variable to store  panning offset in the x and y directions
    const [isPanning, setIsPanning] = useState(false); // Track if user is panning 
    const [startPos, setStartPos] = useState({ x: 0, y: 0 }); // state variable to store the initial position where the user started panning, helping to calculate the new position as they drag.
    
    const [zoom, setZoom] = useState(1); // State to manage zoom level
    
    const [dots, setDots] = useState([]); // State to manage dots
    const [lines, setLines] = useState([]); // State to store drawn lines
    
    
    //////// Variable Type: Dragging of any dot ////////
    const [hoveredDot, setHoveredDot] = useState(null); // State to mark whether pointer is hovered over dot
    const [draggingDot, setDraggingDot] = useState(null); // State that marks if the dot can be dragged or not

    const graph = useRef(Graph()); // Initialize graph state
    const [lastNodeId, setLastNodeId] = useState(null);

    /*
    Note: In React, useRef is a hook that creates a persistent reference to a value that doesn’t cause re-renders when it changes. It returns an object with a .current property where the value is stored.

    Thus graph.current.addNode is used instead of graph.addNode.
    Consider this like an instance of graph in react canvas.
    */

    //////// Variable Type: Grid Definitions ////////
    /* 
    Meter version: Major grid divided into 10 minor grids 
    */
    const majorGridSize = 100;
    const minorGridSize = majorGridSize / 10;

    //////// Utility fns. Type1: Panning ////////

    const startPan = (e) => {
        /* Triggered when the user clicks down on the canvas */
        if (!(isDrawing || isMoving || isDelete)) {
            setIsPanning(true);
            setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y }); //clientx and clienty are horizontal and vertical coordinate within the application's viewport (https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/clientX)
        }
    };

    const panCanvas = (e) => {
        /* Triggered when the user moves the mouse while holding down the click */
        if (isPanning) {
            setPan({
                x: e.clientX - startPos.x,
                y: e.clientY - startPos.y,
            });
        }
    };

    const endPan = () => {
        /* Triggered when the user releases the mouse button or leaves the canvas area */
        setIsPanning(false);
    };

    //////// Utility fns. Type2: Zooming ////////
    const handleZoom = (e) => {
        // Function to handle zooming
        e.preventDefault(); //stop the default scrolling behavior of the browser when the user scrolls, ensuring that the zoom action only affects your canvas.
        const zoomFactor = 1.1; // Each scroll will increase or decrease the zoom by 10%.
        const newZoom = e.deltaY > 0 ? zoom / zoomFactor : zoom * zoomFactor; // e.deltaY is vertical scroll amount, if it is greater than 0 then it is zoom out

        // Zooming is between 90% to 150%
        if (newZoom >= 0.9 && newZoom <= 1.5) {
            setZoom(newZoom);
        }
    };

    const toScreenCoordinates = (x, y) => {
        // Converts logical coordinates (relative to the grid) into screen coordinates (taking into account the current pan and zoom).
        return {
            x: (x * zoom) + pan.x,
            y: (y * zoom) + pan.y,
        };
    };

    const drawLine = (ctx, startX, startY, endX, endY) => {
        // Draw a line between two points on the canvas.
        ctx.beginPath(); // Begins a new path or resets the current path.
        ctx.moveTo(startX, startY); // Move starting point of the line to (startX, startY)
        ctx.lineTo(endX, endY); // Draw a line to the endpoint coordinates
        ctx.strokeStyle = 'black'; // Set color of line to black
        ctx.lineWidth = 2 / zoom;
        ctx.stroke(); // Strokes the line, making it visible.
        ctx.closePath(); // Closes the path.
    };

    const drawDot = (ctx, x, y, isHovered) => {
        // Inner circle (or regular dot) for all dots
        const innerDotSize = 2 / zoom;
        ctx.beginPath();
        ctx.arc(x, y, innerDotSize, 0, 2 * Math.PI); // Draws an arc centered at (x, y) with radius dotSize and angle 2* Math.PI
        ctx.fillStyle = isHovered ? 'red' : 'blue'; // Solid red if hovered, otherwise blue
        ctx.fill(); // Fills the dot with the specified color.
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1 / zoom;
        ctx.stroke(); // Strokes the dot with the black outline.
        ctx.closePath(); // Closes the path.

        if (isHovered) {
            // Outer circle for the hovered dot
            const outerDotSize = 6 / zoom;
            ctx.beginPath();
            ctx.arc(x, y, outerDotSize, 0, 2 * Math.PI); // Draws an arc centered at (x, y) with radius dotSize and angle 2* Math.PI
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Semi-transparent red
            ctx.fill(); // Fills the dot with the specified color.
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1 / zoom;
            ctx.stroke(); // Strokes the dot with the black outline.
            ctx.closePath(); // Closes the path.
        }
    };

    const calculateGridCoordinates = (x, y) => {
        // Snap the mouseclick to grid coordinates

        // Adjust X and Y for pan and zoom
        const adjustedX = (x - pan.x) / zoom;
        const adjustedY = (y - pan.y) / zoom;
        
        // Snap this adjustedX and Y to nearest grid
        const snappedX = Math.round(adjustedX / minorGridSize) * minorGridSize;
        const snappedY = Math.round(adjustedY / minorGridSize) * minorGridSize;
        return { x: snappedX, y: snappedY };
    };

    const handleCanvasClick = (e) => {
        // Function to handle mouse click on the canvas
        if (isDrawing) {
            const rect = canvasRef.current.getBoundingClientRect(); // Retrieves the position and size of the canvas on the screen
            // Get the x and y for mouseclick
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const { x: gridX, y: gridY } = calculateGridCoordinates(x, y); // Snap mouseclick to the nearest grid intersection, x and y are renamed to gridX and gridY after destructuring

            const nodeId = `${gridX},${gridY}`; // unique node id constructed with screen coordinates

            /*
                Strict Equality (===) compares both the value and the type while Loose Equality (==) compares the values after converting them to a common type (type coercion).
            */

            if (graph.current.adjacent(nodeId).length === 0) {
                graph.current.addNode(nodeId);

                if (lastNodeId) {
                    graph.current.addEdge(lastNodeId, nodeId);
                    setLines([...lines, {
                        start: { x: parseFloat(lastNodeId.split(',')[0]), y: parseFloat(lastNodeId.split(',')[1]) },
                        end: { x: gridX, y: gridY }
                    }]);
                }

                setDots([...dots, { x: gridX, y: gridY }]);
            }

            setLastNodeId(nodeId);
        }
    };

    const handleMouseDown = (e) => {
        //Fn to define mouseclickdown event
        if (hoveredDot !== null) {
            setDraggingDot(hoveredDot);
        } else {
            startPan(e);
        }
    };

    const handleMouseUp = () => {
        setDraggingDot(null);
        endPan();
    };

    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect(); // Retrieves the position and size of the canvas on the screen
        // Get the x and y for mouseclick
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { x: gridX, y: gridY } = calculateGridCoordinates(x, y); // Find the index of a dot in the dots array that matches the grid coordinates (gridX, gridY). If a matching dot is found, its index is stored as the hoveredDot.
    
        if (isDrawing && draggingDot === null) {
            setHoveredDot(dots.findIndex(dot => dot.x === gridX && dot.y === gridY));
        }
    
        if (draggingDot !== null && draggingDot >= 0 && draggingDot < dots.length) {
            const draggedDotId = `${dots[draggingDot].x},${dots[draggingDot].y}`;
    
            // Update the dot's position
            const newDots = dots.map((dot, index) => (
                index === draggingDot ? { x: gridX, y: gridY } : dot
            ));
    
            // Update the lines connected to the dragged dot
            const newLines = lines.map(line => {
                if (line.start.x === dots[draggingDot].x && line.start.y === dots[draggingDot].y) {
                    return { start: { x: gridX, y: gridY }, end: line.end };
                } else if (line.end.x === dots[draggingDot].x && line.end.y === dots[draggingDot].y) {
                    return { start: line.start, end: { x: gridX, y: gridY } };
                } else {
                    return line;
                }
            });
    
            // Update the graph to reflect the new positions
            graph.current.removeNode(draggedDotId);
            const newDotId = `${gridX},${gridY}`;
            graph.current.addNode(newDotId);
            newLines.forEach(line => {
                const startNodeId = `${line.start.x},${line.start.y}`;
                const endNodeId = `${line.end.x},${line.end.y}`;
                graph.current.addEdge(startNodeId, endNodeId);
            });
    
            setDots(newDots);
            setLines(newLines);
        } else {
            panCanvas(e);
        }
    };
    

    // const handleMouseMove = (e) => {
    //     const rect = canvasRef.current.getBoundingClientRect();
    //     const x = e.clientX - rect.left;
    //     const y = e.clientY - rect.top;
    //     const { x: gridX, y: gridY } = calculateGridCoordinates(x, y);
    
    //     if (isDrawing && draggingDot === null) {
    //         setHoveredDot(dots.findIndex(dot => dot.x === gridX && dot.y === gridY));
    //     }
    
    //     if (draggingDot !== null) {
    //         if (dots[draggingDot]) {
    //             const draggedDotId = `${dots[draggingDot].x},${dots[draggingDot].y}`;
    
    //             // Update the dot's position
    //             const newDots = dots.map((dot, index) => (
    //                 index === draggingDot ? { x: gridX, y: gridY } : dot
    //             ));
    
    //             // Update the lines connected to the dragged dot
    //             const newLines = lines.map(line => {
    //                 if (line.start.x === dots[draggingDot].x && line.start.y === dots[draggingDot].y) {
    //                     return { start: { x: gridX, y: gridY }, end: line.end };
    //                 } else if (line.end.x === dots[draggingDot].x && line.end.y === dots[draggingDot].y) {
    //                     return { start: line.start, end: { x: gridX, y: gridY } };
    //                 } else {
    //                     return line;
    //                 }
    //             });
    
    //             // Update the graph to reflect the new positions
    //             graph.current.removeNode(draggedDotId);
    //             const newDotId = `${gridX},${gridY}`;
    //             graph.current.addNode(newDotId);
    //             newLines.forEach(line => {
    //                 const startNodeId = `${line.start.x},${line.start.y}`;
    //                 const endNodeId = `${line.end.x},${line.end.y}`;
    //                 graph.current.addEdge(startNodeId, endNodeId);
    //             });
    
    //             setDots(newDots);
    //             setLines(newLines);
    //         } else {
    //             console.warn("draggingDot index is out of bounds:", draggingDot);
    //         }
    //     } else {
    //         panCanvas(e);
    //     }
    // };

    //////////////////////////////////////////////
    
    /*
    The useEffect hook is used to perform side effects in your functional components, such as fetching data, subscribing to external events, or manually changing the DOM.
    useEffect(() => {setup}, [optional dependencies]);

    Starter Tutorial: https://www.youtube.com/watch?v=-4XpG5_Lj_o
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

            // Draw the lines
            lines.forEach(line => {
                const startCoords = toScreenCoordinates(line.start.x, line.start.y);
                const endCoords = toScreenCoordinates(line.end.x, line.end.y);
                drawLine(ctx, startCoords.x, startCoords.y, endCoords.x, endCoords.y);
            });

            // Draw the dots
            dots.forEach((dot, index) => {
                const screenCoords = toScreenCoordinates(dot.x, dot.y);
                drawDot(ctx, screenCoords.x, screenCoords.y, index === hoveredDot);
            });
        };

        // Function Calls
        drawGrid();
    }, [pan, zoom, dots, lines, hoveredDot]);

    useEffect(() => {
        // Graph is printed in console once Draw Wall is disabled
        if (!isDrawing && lastNodeId !== null) {
            console.log("Graph:", graph.current.serialize());
        }
        // if (!isDrawing && graph.edges.length > 0) {
        //     console.log("Graph:", graph);
        // }
    }, [isDrawing]);

    return (
        <canvas
            ref={canvasRef}
            className="drawing-canvas"
            width={window.innerWidth} // Canvas window size
            height={window.innerHeight} // Canvas window size
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleZoom}
            onMouseMove={handleMouseMove}
            onClick={handleCanvasClick}
        />
    );
};

export default Canvas;

/* 
onClick={handleCanvasClick}    => Draw Wall link
onWheel={handleZoom}           => Zooming link
onMouseMove={handleMouseMove}  => Panning link, wall endpoint color change on hovering

Canvas "onMouseMove" is triggered whenever the mouse moves
*/
