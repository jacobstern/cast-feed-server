import { getPodcastFromUrl } from './podcast-rss';
import uploadImageSizes from './upload-image-sizes';
import Podcast from '../../models/podcast';
import winston from 'winston';

export default function processPodcastFeed(url) {
  return getPodcastFromUrl(url)
    .then(podcast => {
      const model = podcast;
      const image = podcast.image;

      let next;

      if (image) {
        next = uploadImageSizes(image, [60, 100, 600])
          .then(urls => {
            if (urls) {
              model.image60 = urls[0];
              model.image100 = urls[1];
              model.image600 = urls[2];
            }
          })
          .catch(winston.error);
      } else {
        next = Promise.resolve();
      }

      return next.then(() => new Podcast(model).saveAsync());
    });
}
