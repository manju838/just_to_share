import React, { useEffect, useRef, useState } from 'react';
import './Canvas.css';
import Graph from 'graph-data-structure';
import { useImage } from 'react-image';

/* Dragging point working but buggy */

const Canvas = ({isDrawing, isMoving, isDelete, uploadedImage, imageOpacity }) => {
    
    const canvasRef = useRef(null); // A reference to the canvas element.

    const [pan, setPan] = useState({ x: 0, y: 0 }); // State variable to store  panning offset in the x and y directions
    const [isPanning, setIsPanning] = useState(false); // Track if user is panning 
    const [startPos, setStartPos] = useState({ x: 0, y: 0 }); // state variable to store the initial position where the user started panning, helping to calculate the new position as they drag.
    
    const [zoom, setZoom] = useState(1); // State to manage zoom level
    
    const [dots, setDots] = useState([]); // State to manage dots
    const [lines, setLines] = useState([]); // State to store drawn lines
    
    
    const [hoveredDot, setHoveredDot] = useState(null); // State to mark whether pointer is hovered over dot
    const [draggingDot, setDraggingDot] = useState(null); // State that marks if the dot can be dragged or not

    const graph = useRef(Graph()); // Initialize graph state
    const [lastNodeId, setLastNodeId] = useState(null);
    
    const [image, setImage] = useState(null); // State for storing the uploaded image

    const { src: imageSrc } = useImage({
        srcList: uploadedImage,
        useSuspense: false,
      });

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => setImage(img);
            };
            reader.readAsDataURL(file);
        }
    };

    const majorGridSize = 100;
    const minorGridSize = majorGridSize / 10;

    const startPan = (e) => {
        /* Triggered when the user clicks down on the canvas */
        if (!(isDrawing || isMoving || isDelete)) {
            setIsPanning(true);
            setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
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
        e.preventDefault();
        const zoomFactor = 1.1;
        const newZoom = e.deltaY > 0 ? zoom / zoomFactor : zoom * zoomFactor;

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
        setDraggingDot(null); // Stop dragging the dot
        setHoveredDot(null);   // Reset the hovered dot
        endPan();
    };

    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect(); // Retrieves the position and size of the canvas on the screen
        // Get the x and y for mouseclick
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { x: gridX, y: gridY } = calculateGridCoordinates(x, y);
    
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

    useEffect(() => {
        // Code in this curly braces gets executed once at beginning and whenever the dependency array is satisfied.

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');         

        const render = () => {
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.scale(zoom, zoom);
            ctx.translate(pan.x / zoom % majorGridSize, pan.y / zoom % majorGridSize);

            // Draw uploaded image as translucent background
            if (uploadedImage && image) {
                ctx.globalAlpha = imageOpacity; // Set opacity
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                ctx.globalAlpha = 1.0; // Reset alpha for other drawings
            }

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
        render();
    }, [pan, zoom, dots, lines, hoveredDot, uploadedImage, imageOpacity]);

    useEffect(() => {
        // Graph is printed in console once Draw Wall is disabled
        if (!isDrawing && lastNodeId !== null) {
            console.log("Graph:", graph.current.serialize());
    
            // Log edges with starting and ending node IDs
            const edges = lines.map(line => ({
                startNode: `${line.start.x},${line.start.y}`,
                endNode: `${line.end.x},${line.end.y}`
            }));
            console.log("Edges:", edges);
        }
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
