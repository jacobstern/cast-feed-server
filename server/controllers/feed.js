import httpStatus from 'http-status';
import dispatcher from '../jobs/dispatcher';
import { JOB_STATUS_ERROR } from '../jobs/constants';
import Podcast from '../models/podcast';

const RESPONSE_FIELDS = 'feed title description date link image60 image100 image600 author category explicit lang';

function get(req, res, next) {
  const feed = req.query.url;

  Podcast.findByFeed(feed, RESPONSE_FIELDS)
    .then(podcast => {
      if (podcast) {
        res.send(podcast.toJSON());
      } else {
        const status = dispatcher.doProcessPodcastFeed(req.query.url);

        if (status === JOB_STATUS_ERROR) {
          res.sendStatus(httpStatus.NOT_FOUND);
        } else {
          res.sendStatus(httpStatus.ACCEPTED);
        }
      }
    })
    .catch(next);
}

export default { get };
