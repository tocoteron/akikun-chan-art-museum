import React, { useState, useEffect, useCallback } from 'react';
import Gallery, { PhotoProps } from "react-photo-gallery";
import Carousel, { Modal, ModalGateway } from "react-images";

interface Image {
  url: string;
  width: number;
  height: number;
}

interface Tweet {
  tweetURL: string;
  tweetID: string;
  userScreenName: string;
  images: Image[];
}

function App() {
  const [tweetImages, setTweetImages] = useState<Tweet[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [viewerIsOpen, setViewerIsOpen] = useState(false);

  useEffect(() => {
    getTweetImages();
  }, [])

  async function getTweetImages() {
    const res = await fetch('http://localhost:1323/images');
    const tweetImages: Tweet[] = await res.json();
    setTweetImages(tweetImages);
  }

  function tweetToPhotoProps(tweet: Tweet): PhotoProps {
    return {
      src: tweet.images[0].url,
      width: tweet.images[0].width,
      height: tweet.images[0].height,
    }
  }

  const openLightbox = useCallback((event, { photo, index }) => {
    setCurrentImage(index);
    setViewerIsOpen(true);
  }, []);

  const closeLightbox = () => {
    setCurrentImage(0);
    setViewerIsOpen(false);
  };

  return (
    <div className="App">
      <button
        onClick={() => getTweetImages()}
      >RELOAD</button>
      <Gallery
        photos={tweetImages.map((tweetImage: Tweet) => tweetToPhotoProps(tweetImage))}
        onClick={openLightbox}
      />
      <ModalGateway>
        {viewerIsOpen ? (
          <Modal onClose={closeLightbox}>
            <Carousel
              currentIndex={currentImage}
              views={tweetImages.map(tweet => {
                const photo = tweetToPhotoProps(tweet);
                return {
                  source: photo.src,
                  caption: `@${tweet.userScreenName}`,
                };
              })}
            />
          </Modal>
        ) : null}
      </ModalGateway>
    </div>
  );
}

export default App;
