import '../../css/Upload.css';
import React, { useState, useEffect } from 'react';
import { ref, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { toast } from "react-toastify";
import { toastSuccessStyle, toastErrorStyle } from '../utils/toastStyle.js';
import { VideoToFrames, VideoToFramesMethod } from '../utils/ThumbnailGenerator.jsx';
import ProgressBar from "@ramonak/react-progress-bar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import imageCompression from 'browser-image-compression';

// runCompleted is callback for tab component
function VideoUpload({storage, runCompleted}) {

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectedFilesCopy, setSelectedFilesCopy] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [allUploadDone, setAllUploadDone] = useState(false);
    const [uploadTrack, setUploadTrack] = useState(0);
    const [eachUpdated, setEachUpdated] = useState([]);
    const [abortController, setAbortController] = useState(null);
    const [videoUProgress, setVideoUProgress] = useState(0);
    const [thumbnailUProgress, setThumbnailUProgress] = useState(0);
    const [thumbnailCompressionProgress, setThumbnailCompressionProgress] = useState(0);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadingFile, setUploadingFile] = useState('');
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    let isSomeFailed = false;
    let isCompleteFailed = false;

    useEffect(() => {
        return () => {
            if (abortController) {
            abortController.abort();
            }
        };
    }, [abortController]);

    // calculate main progress value
    useEffect(() => {
        const prog = Math.abs(Math.round((thumbnailCompressionProgress + thumbnailUProgress + videoUProgress) / 3));
        if (prog > 100)
            setUploadProgress(100);
        else 
            setUploadProgress(prog);
      }, [thumbnailCompressionProgress, thumbnailUProgress, videoUProgress]);

    const handleFileChange = (e) => {
        setAllUploadDone(false);
        setSelectedFilesCopy([]);
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
    };

    async function revokeThumbnailUpload(thumbnailRef) {
        try {
          await deleteObject(thumbnailRef);
          console.log('Thumbnail revoked successfully');
        } catch (error) {
          if (error.code === 'storage/object-not-found') {
            console.log('The thumbnail you tried to delete does not exist.');
          } else {
            console.error('Error revoking thumbnail:', error.message || error);
          }
        }
      }

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast.error("No video selected", toastErrorStyle());
            return;
        }
        if (selectedFiles.length > 25) {
            toast.error("Cannot upload more than 25 videos at once", toastErrorStyle());
            return;
        }
        setAllUploadDone(false);
        setUploading(true);
        isSomeFailed = false;
        isCompleteFailed = false;
        runCompleted(false);
        setUploadingFile('');
        const controller = new AbortController();
        setAbortController(controller);

        try {
            const updatedArray = new Array(selectedFiles.length).fill(true); // set all file upload as successful initially
            setEachUpdated(updatedArray);
            setUploadTrack(selectedFiles.length);

            setSelectedFilesCopy(selectedFiles);

            const supportedExtensions = ['mp4', 'webm', 'ogg', 'mpg', 'mov', 'avi', 'mpeg'];
            let thumbnailRef; // needed as global for passing to revokeThumbnail function
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                try {
                    setUploadingFile(file.name);
                    setThumbnailUProgress(0);
                    setVideoUProgress(0);
                    setUploadProgress(0);
                    setThumbnailCompressionProgress(0);
                    // if component unmounts, cancel upload
                    if (controller.signal.aborted) {
                        return;
                    }

                    const fileExtension = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase();
                    if(!supportedExtensions.includes(fileExtension)) {
                        throw new Error('Invalid video format');
                    }

                    const thumbnail = await generateThumbnail(file);
                    const thumbnailName = file.name.slice(0, file.name.lastIndexOf('.')) + '.png';

                    if(thumbnail === null)
                        throw new Error(`Thumbnail creation failed for video ${file.name}`);

                    // thumbnail compression
                    const options = {
                        maxSizeMB: 3,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                        onProgress: (progress) => {
                            setThumbnailCompressionProgress(progress);
                        }
                    };
                    const compressedThumbnailFile = await imageCompression(thumbnail, options);
            
                    thumbnailRef = ref(storage, `thumbnails/${thumbnailName}`);

                    await new Promise((resolve, reject) => {
                        const uploadTask = uploadBytesResumable(thumbnailRef, compressedThumbnailFile, { contentType: 'image/png' });

                        uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setThumbnailUProgress(progress);
                        },
                        (error) => {
                            reject(error);
                        },
                        () => {
                            setThumbnailUProgress(100);
                            resolve(); 
                        }
                        );
                    });

                    const thumbnailUrl = await getDownloadURL(thumbnailRef);

                    const videoRef = ref(storage, `videos/${file.name}`);
            
                    const metadata = {
                        contentType: file.type,
                        customMetadata: {
                            thumbnailUrl: thumbnailUrl
                        }
                    };

                    await new Promise((resolve, reject) => {
                        const uplaodTask = uploadBytesResumable(videoRef, file, metadata);

                        uplaodTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setVideoUProgress(progress);
                        },
                        (error) => {
                            reject(error);
                        },
                        () => {
                            setVideoUProgress(100);
                            resolve(); 
                        }
                        );
                    });
            
                } catch (error) {
                    await revokeThumbnailUpload(thumbnailRef); // Revoke video if upload fails
                    updatedArray[i] = false; // if upload failed, then set failed for that file
                    console.error(`Error uploading video "${file.name}":`, error);
                    isSomeFailed = true;
                } finally {
                    setUploadTrack(prevCount => prevCount - 1);
                }
                // Add delay before processing the next file
                await delay(1000);
            }
        } catch (error) {
            console.error('Error uploading videos:', error);
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
                toast.error("Some videos could not be uploaded", {...toastErrorStyle(), autoClose:false}); // if some files couldn't be uploaded
            else if (!isCompleteFailed && !isSomeFailed)
                toast.success("Videos successfully uploaded", {...toastSuccessStyle(), autoClose:false}); // if all files are uploaded

            // callback for tab component
            runCompleted(true);
        }

    };

    const generateThumbnail = async (file) => {
        try {
          const videoUrl = URL.createObjectURL(file);
      
          const frames = await VideoToFrames.getFrames(videoUrl, 1, VideoToFramesMethod.totalFrames);
          const frameData = frames[0];
      
          // Remove the data URL prefix
          const base64WithoutPrefix = frameData.split(",")[1];
      
          // Decode the base64 string to binary data
          const binaryData = atob(base64WithoutPrefix);
      
          // Create an ArrayBuffer to store the binary data
          const arrayBuffer = new ArrayBuffer(binaryData.length);
      
          // Create a typed array to represent the binary data
          const uint8Array = new Uint8Array(arrayBuffer);
      
          // Fill the typed array with the binary data
          for (let i = 0; i < binaryData.length; i++) {
            uint8Array[i] = binaryData.charCodeAt(i);
          }
      
          // Create a Blob object from the binary data
          const blob = new Blob([uint8Array], { type: 'image/png' });
      
          // Create an object URL for the Blob
          return blob;
        } catch (error) {
          console.error('Error generating thumbnail:', error.message || error);
          return null;
        }
      };
      
    return (

        <div className='upload-mainBody'>

            <div className='upload-wrapper'>
                <header>Upload videos</header>
                <form className='upload-form'>
                    <label htmlFor="upload-input">
                        <i className="fas fa-cloud-upload-alt"></i>
                        <p>Browse file to upload</p>
                    </label>
                    <input type="file" id="upload-input"
                     onClick={(e) => { if (uploading){
                        e.preventDefault();
                        toast.error("Please wait until the current files finish uploading.",toastErrorStyle()) }}}
                     onChange={handleFileChange} 
                     accept="video/*" 
                     multiple 
                     style={{ display: 'none' }} />
                </form>
                {selectedFiles.length > 0 ? (
                    <>
                        No of selected Files : <strong>{selectedFiles.length}</strong>
                    </>
                ) : ('')}

                <section className="upload-progress-area">

                    <button onClick={handleUpload} className='upload-button' type="submit" disabled={uploading}>
                        {uploading ? <>Uploading <FontAwesomeIcon icon={faSpinner} spin /></>: 'Upload'}
                    </button>
                    {uploading && 
                        <div>
                            <div className='upload-filename-text'>{uploadingFile}</div>
                            <ProgressBar 
                             completed={uploadProgress}
                             height='17px'
                             customLabel={`${uploadProgress.toFixed(0)}`}
                             bgColor="#850F8D"
                            labelColor="#ffff" />
                        </div>
                    }
                    <div className="remaing-css" style={{ marginTop: '10px' }}>
                        Remaining : <strong>{uploadTrack}</strong>
                    </div>

                    <div className="failed-uploads-container">
                    {allUploadDone &&
                        eachUpdated.map((value, i) => value !== true ?
                            <div className='failed-file-upload' style={{ backgroundColor: "red", display: "flex" }} 
                            key={`${i}-failed-vid-upload`}>
                                {/* display these in row style */}
                                <div className='failed-upload-file-name'>{selectedFilesCopy[i].name}</div>
                                <div>Failed</div>
                            </div>
                            : null
                        )
                    }
                    </div>
                </section>
            </div>
        </div>

    );
}

export default VideoUpload;