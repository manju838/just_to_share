import React, { useRef, useState } from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import { CountUp } from 'use-count-up'

const UploadBox = ({ onImageUpload, onUploadComplete }) => {

    const inputRef = useRef(null); // reference to file input element, allowing direct access to it without causing re-renders.
    const [uploadProgress, setUploadProgress] = useState(0); // state variable to hold progress percentage of upload, initialized to 0. 

    const handleFileInputChange = (e) => {
        /*
        Event handler function that will be triggered when the user selects a file from the file input.

        The event object e provides information about the event, including the file selected.
        */
        const file = e.target.files[0]; // retrieves the first file from the file input (assuming multiple files are dragged in)
        if (file && file.type.startsWith('image/')) {
            /*
            Check if:
            Whether a file has been selected (file is truthy).
            Whether the file is an image (its MIME type starts with image/, thus it allows jpg, jpeg,png,svg,bmp, gif etc.).

            FileReader API, which allows reading the contents of files (in this case, the image file) asynchronously.
            */
            const reader = new FileReader();
            

            reader.onprogress = (event) => {
                // Sets up an "onprogress" event of the FileReader thus called periodically while the file is being read, and it can be used to track the progress.

                // event.lengthComputable is a boolean that indicates whether the total size of the file is known and measurable.
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded * 100) / event.total);
                    setUploadProgress(progress);
                }
            };

            reader.onloadend = () => {
                // onloadend event is triggered when the file reading is complete (successfully or not)
                console.log("Upload complete..");
                onImageUpload(file); // The main code line that links the input to the webapp for further processing, i.e displaying in Navpage canvas here

                if (onUploadComplete) {
                    onUploadComplete(); // Notify the parent to switch page
                }
            };

            reader.readAsDataURL(file); // Read the file as a Data URL (a base64-encoded string representing the file's data).

        }
    };

    const handleClick = () => {
        // The fn that handles clicking in Uploads page to upload a file
        inputRef.current.click();
    };

    return (
        // <div className="upload-box" onClick={handleClick}>
        //     <p>Drag & Drop an image here or Click to Browse</p>
        //     <input
        //         type="file"
        //         ref={inputRef}
        //         style={{ display: 'none' }}
        //         onChange={handleFileInputChange}
        //     />
        //     {uploadProgress > 0 && <LinearProgress variant="determinate" value={uploadProgress} />}
        // </div>

        <div className="upload-box-container">
            <div className="upload-box" onClick={handleClick}>
                <p>Drag & Drop an image here or Click to Browse</p>
                <input
                    type="file"
                    ref={inputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                />
            </div>
            {uploadProgress > 0 && (
                <div className="progress-bar-container">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <span className="progress-text">{uploadProgress}%</span>
                </div>
            )}
        </div>

    );
};

export default UploadBox;
