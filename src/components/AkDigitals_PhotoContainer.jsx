import React, { useState, useEffect } from 'react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faTimes } from '@fortawesome/free-solid-svg-icons';
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { toast } from 'react-toastify';
import { toastErrorStyle } from './utils/toastStyle';
import { InView } from "react-intersection-observer";
import './../css/PhotoContainer.css';
import './../css/Fullscreen.css';
import FloatingScrollBtn from './utils/scrollToTop/FloatingBtn';
import EndReachedBtn from './utils/scrollToTop/EndReachedBtn';

function PhotoContainer({storage}) {

  // Define state variables
  const [isOpened, setIsOpened] = useState(false);
  const [data, setData] = useState({ img: '', i: 0 });
  const [imageUrls, setImageUrls] = useState([]);
  const [page, setPage] = useState(1);
  const imagesPerPage = 12;
  const [imageRefs, setImageRefs] = useState([]);
  const [viewMorePaused, setViewMorePaused] = useState(false);
  const [endReached, setEndReached] = useState(false);
  const [floatingDisabled, setFloatingDisabled] = useState(false);

  // Function to view image
  const viewImage = (img, i) => {
    setData({ img, i });
    setIsOpened(true);
  }

  useEffect(() => {
    if (isOpened)
      document.body.style.overflow = 'hidden';
    else
      document.body.style.overflow = '';

    // Clean up on unmount or when isOpened changes
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpened]);

  // Function to handle image actions (next, previous, close)
  const imgAction = (action) => {
    if (action === 'next-img') {
      let newIndex = data.i + 1;
      if (newIndex < imageUrls.length) {
        setData({ img: imageUrls[newIndex].url, i: newIndex });
      }
    } else if (action === 'previous-img') {
      let newIndex = data.i - 1;
      if (newIndex >= 0) {
        setData({ img: imageUrls[newIndex].url, i: newIndex });
      }
    } else if (action === 'close-img') {
      setIsOpened(false); // Close the full-screen view
    }
  }

    useEffect(() => {
        initialFetchImages(); // only once retreive all images from database
    }, []);

    useEffect(() => {
        fetchImages();
    }, [page, imageRefs]);

    async function initialFetchImages() {
        try {
            const imageRefsTemp = await listAll(ref(storage, 'images')); // List items inside 'images' folder
            const imageRefsItems = imageRefsTemp.items;

            // Fetch metadata for each image to get the upload time
            const imagesWithMetadata = await Promise.all(
                imageRefsItems.map(async (imageRef) => {
                    const metadata = await getMetadata(imageRef);
                    return { ref: imageRef, timeCreated: metadata.timeCreated };
                })
            );

            // Sort images by upload time, newest first
            imagesWithMetadata.sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated));

            // Remove the uploadTime from the final array
            const sortedImageRefs = imagesWithMetadata.map(image => image.ref);

            setImageRefs(sortedImageRefs);
        } catch (error) {
            toast.error("Something went wrong, Please try again!", toastErrorStyle());
            console.error('Error listing items in storage:', error);
        }
    }

    async function fetchImages() {
        if(imageRefs && imageRefs.length >= 1){
            try {
                const startIndex = (page - 1) * imagesPerPage;
                const endIndex = startIndex + imagesPerPage;
    
                const totalPages = Math.ceil(imageRefs.length / imagesPerPage);
    
                const urls = await Promise.all(imageRefs.slice(startIndex, endIndex).map(async (itemRef) => {
                    try {
                        const url = await getDownloadURL(itemRef);
                        return { url, loaded: false };
                    } catch (error) {
                        console.error('Error getting download URL for itemRef:', error);
                        return null;
                    }
                }));
    
                // If it's the last page, reset the page count
                if (page === totalPages) {
                    setPage(1);
                    setEndReached(true);
                }
    
                setImageUrls(prevUrls => [...prevUrls, ...urls.filter(url => url !== null)]);

            } catch (error) {
                toast.error("Something went wrong, Please try again!",toastErrorStyle());
                console.error('Error listing items in storage:', error);
            }
        } 
    }

    const handleViewMore = () => {
        if (viewMorePaused)
            return;

        setViewMorePaused(true);
        setTimeout(() => {
            setPage(prevPage => prevPage + 1);
            setViewMorePaused(false);
        }, [2250]);
    };

    const handleImageLoad = (index) => {
        setImageUrls(prevImageUrls => {
            const updatedImageUrls = [...prevImageUrls];
            updatedImageUrls[index].loaded = true; // Mark image as loaded
            return updatedImageUrls;
        });
    };

  return (
        <>
            <>
                {data.img && (
                <div className={`full-screen-image-container ${isOpened ? 'open' : 'close'}`}>
                    <button className="close-btn" onClick={() => imgAction('close-img')}>
                    <FontAwesomeIcon icon={faTimes} />
                    </button>

                    {data.i > 0 && (
                    <button className="nav-btn prev-btn" onClick={() => imgAction('previous-img')}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    )}
                    <img src={data.img} className="full-screen-image" alt="" onContextMenu={(e) => e.preventDefault()}/>
                    {data.i < imageUrls.length - 1 && (
                    <button className="nav-btn next-btn" onClick={() => imgAction('next-img')}>
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                    )}
                </div>
                )}
            </>

            {/* Scroll to top Floating Btn */}
            {!floatingDisabled ? <FloatingScrollBtn /> : null }

            <div className={`photo-container ${isOpened ? 'animate' : ''}`} >
                {imageUrls.length>0 ?
                    <ResponsiveMasonry columnsCountBreakPoints={{ 380: 1, 750: 2, 900: 3 }}>
                    <Masonry gutter='17px'>
                        {imageUrls.map(({ url, loaded }, index) => (
                            <InView
                                as="img"
                                className='image-video'
                                key={index}
                                onChange={(inView, entry) => {
                                    // Trigger inView callback even before fully visible
                                    if (entry.isIntersecting || entry.boundingClientRect.top < 300) {
                                    inView && loaded ? (url = url) : (url = '');
                                    }
                                }}
                                onLoad={() => handleImageLoad(index)}
                                onContextMenu={(e) => e.preventDefault()}
                                src={url}
                                alt={`Image ${index}`}
                                data-index={index}
                                onClick={() => viewImage(url, index)} // Click to open image in full-screen
                                style={{ display: loaded ? 'inline' : 'none', cursor : 'pointer' }}
                            >
                            </InView>
                        ))}
                    </Masonry>
                    </ResponsiveMasonry>
                :
                    <center><div>Nothing here yet. Stay tuned!</div></center>
                }
            </div>
            
            {!endReached?
                <div className='loading-viewMore' style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', }}>
                    {/* Loading & ViewMore */}
                    {imageUrls.length > 0 && (
                    <InView
                        as="div"
                        className='loading'
                        onChange={(inView) => inView? handleViewMore()  : ''}>
                    </InView>
                    )}
                </div> 
            :
                <>
                    { imageUrls.length > 12 &&
                        <InView
                            as="div"
                            onChange={(inView) => inView? setFloatingDisabled(true)  : setFloatingDisabled(false)}>
                            <EndReachedBtn />
                        </InView>
                    }
                </>
            }

        </>
  );
}

export default PhotoContainer;