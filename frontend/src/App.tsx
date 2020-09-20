import React, { useState, useEffect } from 'react';
import Gallery, {PhotoProps} from "react-photo-gallery";

interface Image {
  url: string;
  width: number;
  height: number;
}

interface TweetImages {
  tweetURL: string;
  tweetID: string;
  userScreenName: string;
  images: Image[];
}

function App() {
  const [tweetImages, setTweetImages] = useState<TweetImages[]>([]);

  useEffect(() => {
    getTweetImages();
  }, [])

  async function getTweetImages() {
    const res = await fetch('http://localhost:1323/images');
    const tweetImages: TweetImages[] = await res.json();
    setTweetImages(tweetImages);
  }

  return (
    <div className="App">
      <button
        onClick={() => getTweetImages()}
      >RELOAD</button>
      <Gallery
        photos={tweetImages.map((tweetImage: TweetImages) => {
          return {
            src: tweetImage.images[0].url,
            width: tweetImage.images[0].width,
            height: tweetImage.images[0].height,
          };
        })}
      />
    </div>
  );
}

export default App;
