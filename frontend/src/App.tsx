import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import Gallery, {
  PhotoProps,
} from "react-photo-gallery";

import Carousel, {
  Modal,
  ModalGateway,
  ViewType,
} from "react-images";

import {
  Backdrop,
  Button,
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

import {
  Add as AddIcon,
  Cached as CachedIcon,
} from '@material-ui/icons';

import PullToRefresh from 'react-simple-pull-to-refresh';

import {
  Tweet,
} from '../../functions/src/twitter';

import firebaseFactory from './firebase';

const BackGroundGreenColor = "#DD8";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
    },
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
    loadButton: {
      margin: 8,
      width: "calc(100% - 16px)",
    }
  }),
);

const ReloadFab = styled(Fab)({
  zIndex: 1000,
  color: "#fff",
  backgroundColor: BackGroundGreenColor,
  '&:hover': {
    backgroundColor: BackGroundGreenColor,
  },
})

const ReloadIconFontSize = 32;
const ReloadIcon = styled(CachedIcon)({
  color: "#fff",
  fontSize: ReloadIconFontSize,
});

const PullDownRefreshingContentMargin = 16;
const PullDownRefreshingContent = (
  <div style={{margin: `${PullDownRefreshingContentMargin}px 0`}}>
    <ReloadIcon />
  </div>
);

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

function App() {
  const classes = useStyles();
  const minUpdateImagesDurationTime = 1000; // ms
  const pagingSizeOfTweets = 10;
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [viewerIsOpen, setViewerIsOpen] = useState(false);
  const [isBackdropOpened, setIsBackdropOpened] = React.useState(false);
  const [latestUpdateImagesTimestamp, setLatestUpdateImagesTimestamp] = React.useState<Date>();

  const loadNewTweetImages = useCallback(async (currentTimestamp?: Date) => {
    setIsBackdropOpened(true);

    try {
      let tweetsRef: firebase.firestore.Query<firebase.firestore.DocumentData>;

      if (tweets.length === 0) {
        tweetsRef = firebaseFactory.firestore()
          .collection("tweets")
          .orderBy("createdAt", "desc")
          .limit(pagingSizeOfTweets);
      } else {
        tweetsRef = firebaseFactory.firestore()
          .collection("tweets")
          .orderBy("createdAt", "desc")
          .startAfter(tweets[tweets.length - 1].createdAt)
          .limit(pagingSizeOfTweets);
      }
      
      const allTweets = await tweetsRef.get();
      const newTweets: Tweet[] = [
        ...tweets,
        ...allTweets.docs.map<any>((tweetDoc) => tweetDoc.data()),
      ];

      setTweets(newTweets);
      setLatestUpdateImagesTimestamp(currentTimestamp ? currentTimestamp : new Date());

      console.log("Images have updated")
    } catch(err) {
      console.error(err);
    }

    return setIsBackdropOpened(false);
  }, [tweets]);

  const reloadTweetImages = useCallback(async (count: number, currentTimestamp?: Date) => {
    setIsBackdropOpened(true);

    try {
      const tweetsRef = firebaseFactory.firestore()
        .collection("tweets")
        .orderBy("createdAt", "desc")
        .limit(count);
      
      const allTweets = await tweetsRef.get();
      const newTweets: Tweet[] = allTweets.docs.map<any>((tweetDoc) => tweetDoc.data());

      setTweets(newTweets);
      setLatestUpdateImagesTimestamp(currentTimestamp ? currentTimestamp : new Date());

      console.log("Images have updated")
    } catch(err) {
      console.error(err);
    }

    return setIsBackdropOpened(false);
  }, []);

  const canLoadNewTweetImages = useCallback((currentTimestamp: Date, latestUpdateImagesTimestamp?: Date) => {
    if (!latestUpdateImagesTimestamp) {
      return true;
    }

    const duration = currentTimestamp.getTime() - latestUpdateImagesTimestamp.getTime();

    return duration > minUpdateImagesDurationTime
  }, []);

  const loadNewTweetImagesWithRateLimit = useCallback(async (latestUpdateImagesTimestamp?: Date) => {
    const currentTimestamp = new Date();

    if (!canLoadNewTweetImages(currentTimestamp, latestUpdateImagesTimestamp)) {
      console.log("Images have not updated")
      return;
    }

    return await loadNewTweetImages(currentTimestamp);
  }, [canLoadNewTweetImages, loadNewTweetImages]);

  const reloadTweetImagesWithRateLimit = useCallback(async (count: number, latestUpdateImagesTimestamp?: Date) => {
    const currentTimestamp = new Date();

    if (!canLoadNewTweetImages(currentTimestamp, latestUpdateImagesTimestamp)) {
      console.log("Images have not updated")
      return;
    }

    return await reloadTweetImages(count, currentTimestamp);
  }, [canLoadNewTweetImages, reloadTweetImages]);

  const openLightbox = useCallback((event, { photo, index }) => {
    setCurrentImage(index);
    setViewerIsOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setCurrentImage(0);
    setViewerIsOpen(false);
  }, []);

  useEffect(() => {
    reloadTweetImagesWithRateLimit(pagingSizeOfTweets);
  }, [reloadTweetImagesWithRateLimit]);

  return (
    <div className={classes.root}>
      <Hidden xsDown>
        <Tooltip title="Reload" aria-label="reload">
          <ReloadFab
            color="primary"
            className={classes.fixedRightBottom}
            onClick={() => {
              reloadTweetImagesWithRateLimit(
                Math.max(pagingSizeOfTweets, tweets.length),
                latestUpdateImagesTimestamp,
              );
            }}
          >
            <CachedIcon />
          </ReloadFab>
        </Tooltip>
      </Hidden>
      <Backdrop className={classes.backdrop} open={isBackdropOpened}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <PullToRefresh
        onRefresh={async () => {
          reloadTweetImagesWithRateLimit(
            Math.max(pagingSizeOfTweets, tweets.length),
            latestUpdateImagesTimestamp,
          );
        }}
        pullDownThreshold={ReloadIconFontSize + 2 * PullDownRefreshingContentMargin}
        maxPullDownDistance={ReloadIconFontSize + 2 * PullDownRefreshingContentMargin}
        refreshingContent={PullDownRefreshingContent}
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
      <Button
        className={classes.loadButton}
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => loadNewTweetImagesWithRateLimit(latestUpdateImagesTimestamp)}
      >
        読み込み
      </Button>
    </div>
  );
}

export default App;
