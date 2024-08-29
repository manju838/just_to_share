import React, { useState } from 'react';
import './Navbar.css';

import './Canvas.js';
import Canvas from './Canvas.js';
import UploadBox from './UploadBox';


/* Navbar+ Btns unique to nav page+ drawing canvas display+ infinite pan working

Snapping is working but line drawing is not starting properly from cursor
TODOs:
1) Appearance of drawing canvas more square like instead of present rectangle
2) Upload Image + opacity changer
3) Canvas coordinates auto snapping to grid intersections

*/

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activePage, setActivePage] = useState('Uploads'); // "Uploads" is the default starting page
    const [isDrawing, setIsDrawing] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [isDelete, setIsDelete] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [imageOpacity, setImageOpacity] = useState(0.5); // Default opacity

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const closeSidebar = () => {
        setIsOpen(false);
    };

    const handlePageClick = (page) => {
        setActivePage(page);
        closeSidebar();
    };

    const toggleDrawingMode = () => {
        setIsDrawing(!isDrawing);
        console.log("Clicked draw btn ....")
    };
    
    const toggleMovingWallMode = () => {
        setIsMoving(!isMoving);
        console.log("Clicked move wall btn ....")
    };
    
    const toggleDeleteWallMode = () => {
        setIsDelete(!isDelete);
        console.log("Clicked delete wall btn ....")
    };

    const handleUploadComplete = () => {
        setActivePage('Edit Floorplan'); // Change to 'Edit Floorplan' when upload completes
    };

    const handleImageUpload = (file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadedImage(reader.result);
        };
        reader.readAsDataURL(file);

        
    };

    const handleOpacityChange = (e) => {
        setImageOpacity(e.target.value);
    };



    return (
        <>
            <div className="navbar">
                {/* Hamburger icon construction (3 div tags for 3 lines in hamburger icon) and attached to toggleMenu() */}
                <div className="hamburger-menu" onClick={toggleMenu}>
                        <div className="hamburger-bar"></div>
                        <div className="hamburger-bar"></div>
                        <div className="hamburger-bar"></div>
                    </div>


                {/* Code to add btns to any of the nav pages exclusively */}

                {/* Code to add buttons in Edit FLoorplan page */}
                {activePage === 'Edit Floorplan' && (
                <div className="buttons">
                    <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={imageOpacity}
                            onChange={handleOpacityChange}
                            style={{ marginLeft: '10px' }}
                        />
                    <button className="nav-button" onClick={toggleDrawingMode}>
                            {isDrawing ? "Stop Drawing" : "Draw Wall"}
                            {/* Anything here is run twice
                            React runs component functions twice in development mode for useState hooks to catch side effects. This behavior is called Strict Mode and ensures that the component doesn’t rely on side effects that can cause bugs.
                            */}
                        </button>

                        <button className="nav-button" onClick={toggleMovingWallMode}>
                            {isMoving ? "Fix Wall" : "Move Wall"}
                        </button>

                        <button className="nav-button" onClick={toggleDeleteWallMode}>
                            {isDelete ? "Done" : "Delete Wall"}
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

                {/* {activePage === 'Uploads' && (
                                    <div className="buttons">
                                        <button className="nav-button">Upload floorplan</button>
                                    </div>
                                )} */}

            </div>

            {/* isOpen is state of sidebar and set using toggleMenu(). Logical AND with that state hook and any btn inside sidebar */}   
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
                    <button className="sidebar-button" onClick={() => handlePageClick('Uploads')}>
                        Uploads
                    </button>
                </div>
            )}

            {/* Canvas */}
            {activePage === "Edit Floorplan" && <Canvas isDrawing={isDrawing} isMoving={isMoving} isDelete={isDelete} uploadedImage={uploadedImage} imageOpacity={imageOpacity}/>}

            {/* Uploads */}
            {activePage === "Uploads" && <UploadBox onImageUpload={handleImageUpload} onUploadComplete={handleUploadComplete} />}
            
        </>            
        
    );
};

export default Navbar;