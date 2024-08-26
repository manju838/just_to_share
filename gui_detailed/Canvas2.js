import React, { useEffect, useRef, useState } from 'react';
import './Canvas.css';
import Graph from 'graph-data-structure';

/* Dragging point working */

const Canvas = ({ isDrawing, isMoving, isDelete }) => {
    const canvasRef = useRef(null);

    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const [zoom, setZoom] = useState(1);

    const [dots, setDots] = useState([]);
    const [lines, setLines] = useState([]);

    const [draggingDot, setDraggingDot] = useState(null);
    const [hoveredDot, setHoveredDot] = useState(null);

    const graph = useRef(Graph());
    const [lastNodeId, setLastNodeId] = useState(null);

    const majorGridSize = 100;
    const minorGridSize = majorGridSize / 10;

    const startPan = (e) => {
        if (!(isDrawing || isMoving || isDelete)) {
            setIsPanning(true);
            setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const panCanvas = (e) => {
        if (isPanning) {
            setPan({
                x: e.clientX - startPos.x,
                y: e.clientY - startPos.y,
            });
        }
    };

    const endPan = () => {
        setIsPanning(false);
    };

    const handleZoom = (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const newZoom = e.deltaY > 0 ? zoom / zoomFactor : zoom * zoomFactor;

        if (newZoom >= 0.9 && newZoom <= 1.5) {
            setZoom(newZoom);
        }
    };

    const toScreenCoordinates = (x, y) => {
        return {
            x: (x * zoom) + pan.x,
            y: (y * zoom) + pan.y,
        };
    };

    const drawLine = (ctx, startX, startY, endX, endY) => {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
        ctx.closePath();
    };

    const drawDot = (ctx, x, y, isHovered) => {
        // Inner circle (or regular dot) for all dots
        const innerDotSize = 2 / zoom;
        ctx.beginPath();
        ctx.arc(x, y, innerDotSize, 0, 2 * Math.PI);
        ctx.fillStyle = isHovered ? 'red' : 'blue'; // Solid red if hovered, otherwise blue
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1 / zoom;
        ctx.stroke();
        ctx.closePath();

        if (isHovered) {
            // Outer circle for the hovered dot
            const outerDotSize = 6 / zoom;
            ctx.beginPath();
            ctx.arc(x, y, outerDotSize, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Semi-transparent red
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1 / zoom;
            ctx.stroke();
            ctx.closePath();
        }
    };

    const calculateGridCoordinates = (x, y) => {
        const adjustedX = (x - pan.x) / zoom;
        const adjustedY = (y - pan.y) / zoom;
        const snappedX = Math.round(adjustedX / minorGridSize) * minorGridSize;
        const snappedY = Math.round(adjustedY / minorGridSize) * minorGridSize;
        return { x: snappedX, y: snappedY };
    };

    const handleCanvasClick = (e) => {
        if (isDrawing) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const { x: gridX, y: gridY } = calculateGridCoordinates(x, y);
            const nodeId = `${gridX},${gridY}`;

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
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { x: gridX, y: gridY } = calculateGridCoordinates(x, y);
    
        if (isDrawing && draggingDot === null) {
            setHoveredDot(dots.findIndex(dot => dot.x === gridX && dot.y === gridY));
        }
    
        if (draggingDot !== null) {
            if (dots[draggingDot]) {
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
                console.warn("draggingDot index is out of bounds:", draggingDot);
            }
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
    //         const draggedDotId = `${dots[draggingDot].x},${dots[draggingDot].y}`;
    
    //         // Update the dot's position
    //         const newDots = dots.map((dot, index) => (
    //             index === draggingDot ? { x: gridX, y: gridY } : dot
    //         ));
    
    //         // Update the lines connected to the dragged dot
    //         const newLines = lines.map(line => {
    //             if (line.start.x === dots[draggingDot].x && line.start.y === dots[draggingDot].y) {
    //                 return { start: { x: gridX, y: gridY }, end: line.end };
    //             } else if (line.end.x === dots[draggingDot].x && line.end.y === dots[draggingDot].y) {
    //                 return { start: line.start, end: { x: gridX, y: gridY } };
    //             } else {
    //                 return line;
    //             }
    //         });
    
    //         // Update the graph to reflect the new positions
    //         graph.current.removeNode(draggedDotId);
    //         const newDotId = `${gridX},${gridY}`;
    //         graph.current.addNode(newDotId);
    //         newLines.forEach(line => {
    //             const startNodeId = `${line.start.x},${line.start.y}`;
    //             const endNodeId = `${line.end.x},${line.end.y}`;
    //             graph.current.addEdge(startNodeId, endNodeId);
    //         });
    
    //         setDots(newDots);
    //         setLines(newLines);
    //     } else {
    //         panCanvas(e);
    //     }
    // };
    
    
    

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const drawGrid = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.scale(zoom, zoom);
            ctx.translate(pan.x / zoom % majorGridSize, pan.y / zoom % majorGridSize);

            ctx.strokeStyle = '#e0e0e0';
            for (let x = -minorGridSize; x < canvas.width / zoom + minorGridSize; x += minorGridSize) {
                for (let y = -minorGridSize; y < canvas.height / zoom + minorGridSize; y += minorGridSize) {
                    ctx.strokeRect(x, y, minorGridSize, minorGridSize);
                }
            }

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            for (let x = -majorGridSize; x < canvas.width / zoom + majorGridSize; x += majorGridSize) {
                for (let y = -majorGridSize; y < canvas.height / zoom + majorGridSize; y += majorGridSize) {
                    ctx.strokeRect(x, y, majorGridSize, majorGridSize);
                }
            }

            ctx.restore();

            lines.forEach(line => {
                const startCoords = toScreenCoordinates(line.start.x, line.start.y);
                const endCoords = toScreenCoordinates(line.end.x, line.end.y);
                drawLine(ctx, startCoords.x, startCoords.y, endCoords.x, endCoords.y);
            });

            dots.forEach((dot, index) => {
                const screenCoords = toScreenCoordinates(dot.x, dot.y);
                drawDot(ctx, screenCoords.x, screenCoords.y, index === hoveredDot);
            });
        };

        drawGrid();
    }, [pan, zoom, dots, lines, hoveredDot]);

    useEffect(() => {
        if (!isDrawing && lastNodeId !== null) {
            console.log("Graph:", graph.current.serialize());
        }
    }, [isDrawing]);

    return (
        <canvas
            ref={canvasRef}
            className="drawing-canvas"
            width={window.innerWidth}
            height={window.innerHeight}
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
