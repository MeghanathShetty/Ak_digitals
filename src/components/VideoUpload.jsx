import './../css/PhotoUpload.css';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { toast } from "react-toastify";
import { toastSuccessStyle, toastErrorStyle } from './uitls/toastStyle.js';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID,
    measurementId: process.env.REACT_APP_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

function VideoUpload() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectedFilesCopy, setSelectedFilesCopy] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [allUploadDone, setAllUploadDone] = useState(false);
    const [uploadTrack, setUploadTrack] = useState(0);
    const [eachUpdated, setEachUpdated] = useState([]);
    let isSomeFailed = false;
    let isCompleteFailed = false;

    const handleFileChange = (e) => {
        setAllUploadDone(false);
        setSelectedFilesCopy([]);
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast.error("No files selected", toastErrorStyle());
            return;
        }
        setAllUploadDone(false);
        setUploading(true);
        isSomeFailed = false;
        isCompleteFailed = false;

        try {
            const updatedArray = new Array(selectedFiles.length).fill(true); // set all file upload as successful initially
            setEachUpdated(updatedArray);
            setUploadTrack(selectedFiles.length);

            setSelectedFilesCopy(selectedFiles);

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                try {
                    // if (i % 2 === 0) {
                    //     throw new Error('Simulated error: i equals 2');
                    // }

                    const storageRef = ref(storage, `videos/${file.name}`);
                    await uploadBytes(storageRef, file);
                } catch (error) {
                    updatedArray[i] = false; // if upload failed, then set failed for that file
                    console.error(`Error uploading file "${file.name}":`, error);
                    isSomeFailed = true;
                } finally {
                    setUploadTrack(prevCount => prevCount - 1);
                }
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            toast.error("Something went wrong, Please try again.", {...toastErrorStyle(), autoClose:false});
            isCompleteFailed = true;
            return;
        } finally {
            setUploading(false);
            setAllUploadDone(true);
            setSelectedFiles([]);

            // Reset input element
            const fileInput = document.getElementById('upload-input');
            fileInput && (fileInput.value = '');

            // display appropriate toast message
            if (!isCompleteFailed && isSomeFailed)
                toast.error("Some files could not be uploaded", {...toastErrorStyle(), autoClose:false}); // if some files couldn't be uploaded
            else if (!isCompleteFailed && !isSomeFailed)
                toast.success("Files successfully uploaded", {...toastSuccessStyle(), autoClose:false}); // if all files are uploaded
        }

    };
    return (

        <div className='mainBody'>
            <Link to="/" className="back-button"><i className="fas fa-arrow-left"></i></Link>

            <div className='wrapper'>
                <header>Upload videos</header>
                <form>
                    <label htmlFor="upload-input">
                        <i className="fas fa-cloud-upload-alt"></i>
                        <p>Browse file to upload</p>
                    </label>
                    <input type="file" id="upload-input" onChange={handleFileChange} accept="video/*" multiple style={{ display: 'none' }} />
                </form>

                <section className="progress-area">

                    <button onClick={handleUpload} className="upload-button">Upload</button>
                    {uploading && <div className="loading-animation">Uploading...</div>}
                    <div className="remaing-css" style={{ marginTop: '10px' }}>
                        <span>Remaining: {uploadTrack}</span>
                    </div>

                    {allUploadDone &&
                        eachUpdated.map((value, i) => value !== true ?
                            <div className='failed-file-upload' style={{ backgroundColor: "red", display: "flex" }} key={i}>
                                {/* display these in row style */}
                                <div>{selectedFilesCopy[i].name}</div>
                                <div>Failed</div>
                            </div>
                            : null
                        )
                    }
                </section>
            </div>
        </div>

    );
}

export default VideoUpload;
