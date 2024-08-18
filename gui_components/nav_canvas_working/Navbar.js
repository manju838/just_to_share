import React, { useState } from 'react';
import './Navbar.css';
import Canvas from './Canvas.js';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activePage, setActivePage] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const closeSidebar = () => {
        setIsOpen(false);
    };

    const handlePageClick = (page) => {
        setActivePage(page);
        closeSidebar();
    };

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const toggleDrawingMode = () => {
        setIsDrawing(!isDrawing);
        setIsMoving(false);
        setIsDeleting(false);
    };

    const toggleMovingWallMode = () => {
        setIsMoving(!isMoving);
        setIsDrawing(false);
        setIsDeleting(false);
    };

    const toggleDeleteWallMode = () => {
        setIsDeleting(!isDeleting);
        setIsDrawing(false);
        setIsMoving(false);
    };

    return (
        <>
            <div className="navbar">
                <div className="hamburger-menu" onClick={toggleMenu}>
                    <div className="hamburger-bar"></div>
                    <div className="hamburger-bar"></div>
                    <div className="hamburger-bar"></div>
                </div>

                {activePage === 'Edit Floorplan' && (
                    <div className="buttons">
                        <button className="nav-button" onClick={toggleDrawingMode}>
                            {isDrawing ? "Stop Drawing" : "Draw Wall"}
                        </button>
                        <button className="nav-button" onClick={toggleMovingWallMode}>
                            {isMoving ? "Fix Wall" : "Move Wall"}
                        </button>
                        <button className="nav-button" onClick={toggleDeleteWallMode}>
                            {isDeleting ? "Done" : "Delete Wall"}
                        </button>
                    </div>
                )}

                {activePage === 'Design in 3D' && (
                    <div className="buttons">
                        <button className="nav-button">Design Button1</button>
                        <button className="nav-button">Design Button2</button>
                        <button className="nav-button">Design Button3</button>
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="sidebar">
                    <button className="close-btn" onClick={closeSidebar}>
                        &times;
                    </button>
                    <button className="sidebar-button" onClick={() => handlePageClick('Edit Floorplan')}>
                        Edit Floorplan
                    </button>
                    <button className="sidebar-button" onClick={() => handlePageClick('Design in 3D')}>
                        Design in 3D
                    </button>
                    <button className="sidebar-button" onClick={() => handlePageClick('Others')}>
                        Others
                    </button>
                </div>
            )}

            {activePage === "Edit Floorplan" && (
                <Canvas isDrawing={isDrawing} isMoving={isMoving} isDeleting={isDeleting} />
            )}
        </>
    );
};

export default Navbar;
