import React, { useState, useEffect, useCallback } from 'react';
import Gallery, { PhotoProps } from "react-photo-gallery";
import Carousel, { Modal, ModalGateway, ViewType } from "react-images";
import { Tweet } from '../../functions/src/twitter';
import firebaseFactory from './firebase';

function App() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [viewerIsOpen, setViewerIsOpen] = useState(false);

  useEffect(() => {
    getTweetImages();
  }, [])

  async function getTweetImages() {
    try {
      const tweetsRef = firebaseFactory.firestore()
        .collection("tweets")
        .orderBy("createdAt", "desc");
      const allTweets = await tweetsRef.get();
      const tweets: Tweet[] = allTweets.docs.map<any>((tweetDoc) => tweetDoc.data());

      setTweets(tweets);
    } catch(err) {
      console.error(err);
    }
  }

  function tweetsToPhotosProps(tweets: Tweet[]): PhotoProps[] {
    return tweets
      .map((tweet) => tweet.images)
      .flat()
      .map((tweetImage) => ({
        src: tweetImage.url,
        width: tweetImage.width,
        height: tweetImage.height,
      }));
  }

  function tweetsToViewsProps(tweets: Tweet[]): ViewType[] {
    const authorImages = tweets.map(tweet =>
      tweet.images.map((image) => ({
        ...image,
        author: tweet.author,
      })),
    );

    return authorImages
      .flat()
      .map(authorImage => ({
        source: authorImage.url,
        caption: `${authorImage.author.name}@${authorImage.author.screenName}`
      }));
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
        photos={tweetsToPhotosProps(tweets)}
        onClick={openLightbox}
      />
      <ModalGateway>
        {viewerIsOpen ? (
          <Modal onClose={closeLightbox}>
            <Carousel
              currentIndex={currentImage}
              views={tweetsToViewsProps(tweets)}
            />
          </Modal>
        ) : null}
      </ModalGateway>
    </div>
  );
}

export default App;
