import React, { useState, useEffect, useCallback } from 'react';
import Gallery, { PhotoProps } from "react-photo-gallery";
import Carousel, { Modal, ModalGateway } from "react-images";
import { Tweet } from '../../functions/src/twitter';

function App() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [viewerIsOpen, setViewerIsOpen] = useState(false);

  useEffect(() => {
    getTweetImages();
  }, [])

  async function getTweetImages() {
    try {
      const res = await fetch(`${process.env.REACT_APP_FIREBASE_CLOUD_FUNCTIONS_BASE}/akikunChanArts`);
      const tweets: Tweet[] = await res.json();
      setTweets(tweets);
    } catch(err) {
      console.error(err);
    }
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
        photos={tweets.map((tweet: Tweet) => tweetToPhotoProps(tweet))}
        onClick={openLightbox}
      />
      <ModalGateway>
        {viewerIsOpen ? (
          <Modal onClose={closeLightbox}>
            <Carousel
              currentIndex={currentImage}
              views={tweets.map(tweet => {
                const photo = tweetToPhotoProps(tweet);
                return {
                  source: photo.src,
                  caption: `${tweet.author.name}@${tweet.author.screenName}`,
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
