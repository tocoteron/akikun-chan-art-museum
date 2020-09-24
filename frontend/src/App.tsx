import React, { useState, useEffect, useCallback } from 'react';
import Gallery, { PhotoProps } from "react-photo-gallery";
import Carousel, { Modal, ModalGateway, ViewType } from "react-images";
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import Tooltip from '@material-ui/core/Tooltip';
import Fab from '@material-ui/core/Fab';
import CachedIcon from '@material-ui/icons/Cached';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Tweet } from '../../functions/src/twitter';
import firebaseFactory from './firebase';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: '#fff',
    },
    fab: {
      margin: theme.spacing(2),
    },
    fixedRightBottom: {
      position: 'fixed',
      bottom: theme.spacing(2),
      right: theme.spacing(3),
    },
  }),
);

function App() {
  const classes = useStyles();
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [viewerIsOpen, setViewerIsOpen] = useState(false);
  const [isBackdropOpened, setIsBackdropOpened] = React.useState(false);

  useEffect(() => {
    getTweetImages();
  }, [])

  async function getTweetImages() {
    setIsBackdropOpened(true);
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
    setIsBackdropOpened(false);
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
      <Tooltip title="Reload" aria-label="reload">
        <Fab
          color="secondary"
          className={classes.fixedRightBottom}
          onClick={() => getTweetImages()}
        >
          <CachedIcon />
        </Fab>
      </Tooltip>
      <Backdrop className={classes.backdrop} open={isBackdropOpened}>
        <CircularProgress color="inherit" />
      </Backdrop>
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
