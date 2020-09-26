import React, {
  useState,
  useEffect,
  useCallback
} from 'react';

import Gallery, {
  PhotoProps
} from "react-photo-gallery";

import Carousel, {
  Modal,
  ModalGateway,
  ViewType
} from "react-images";

import {
  Backdrop,
  CircularProgress,
  Fab,
  Hidden,
  Tooltip,
} from '@material-ui/core';

import {
  Theme,
  createStyles,
  makeStyles,
  styled,
} from '@material-ui/core/styles';

import CachedIcon from '@material-ui/icons/Cached';

import PullToRefresh from 'react-simple-pull-to-refresh';

import {
  Tweet
} from '../../functions/src/twitter';

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

const ReloadFab = styled(Fab)({
  zIndex: 1000,
  color: "#fff",
  backgroundColor: "#DD8",
})

const ReloadIconFontSize = 32;
const ReloadIcon = styled(CachedIcon)({
  color: "#fff",
  fontSize: ReloadIconFontSize,
});

const pullDownRefreshingContentMargin = 16;
const pullDownRefreshingContent = (
  <div style={{margin: `${pullDownRefreshingContentMargin}px 0`}}>
    <ReloadIcon />
  </div>
);

function App() {
  const classes = useStyles();
  const minUpdateImagesDurationTime = 10000; // ms
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [viewerIsOpen, setViewerIsOpen] = useState(false);
  const [isBackdropOpened, setIsBackdropOpened] = React.useState(false);
  const [latestUpdateImagesTimestamp, setLatestUpdateImagesTimestamp] = React.useState<Date>();

  useEffect(() => {
    getTweetImages();
  }, [])

  function canUpdateTweetImages(currentTimestamp: Date) {
    if (!latestUpdateImagesTimestamp) {
      return false;
    }

    const duration = currentTimestamp.getTime() - latestUpdateImagesTimestamp.getTime();

    return duration < minUpdateImagesDurationTime
  }

  async function getTweetImages() {
    setIsBackdropOpened(true);

    const currentTimestamp = new Date();

    if (canUpdateTweetImages(currentTimestamp)) {
      await new Promise(res => setTimeout(res, 1000))

      setIsBackdropOpened(false);

      console.log("Images have not updated")
      return;
    }

    try {
      const tweetsRef = firebaseFactory.firestore()
        .collection("tweets")
        .orderBy("createdAt", "desc");
      const allTweets = await tweetsRef.get();
      const tweets: Tweet[] = allTweets.docs.map<any>((tweetDoc) => tweetDoc.data());

      setTweets(tweets);
      setLatestUpdateImagesTimestamp(currentTimestamp);

      console.log("Images have updated")
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
      <Hidden xsDown>
        <Tooltip title="Reload" aria-label="reload">
          <ReloadFab
            color="primary"
            className={classes.fixedRightBottom}
            onClick={() => getTweetImages()}
          >
            <CachedIcon />
          </ReloadFab>
        </Tooltip>
      </Hidden>
      <Backdrop className={classes.backdrop} open={isBackdropOpened}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <PullToRefresh
        onRefresh={getTweetImages}
        backgroundColor="#DD8"
        pullDownThreshold={ReloadIconFontSize + 2 * pullDownRefreshingContentMargin}
        maxPullDownDistance={ReloadIconFontSize + 2 * pullDownRefreshingContentMargin}
        pullingContent={<></>}
        refreshingContent={pullDownRefreshingContent}
      >
        <Gallery
          photos={tweetsToPhotosProps(tweets)}
          onClick={openLightbox}
        />
      </PullToRefresh>
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
