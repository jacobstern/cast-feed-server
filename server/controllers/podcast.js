import httpStatus from 'http-status';
import Podcast from '../models/podcast';

const RESPONSE_FIELDS = 'feed title description date link image60 image100 image600 author category explicit lang';
const EPISODES_COUNT_LIMIT = 50;

function get(req, res, next) {
  Podcast
    .findById(req.params.id, RESPONSE_FIELDS)
    .then(podcast => {
      if (podcast) {
        res.send(podcast.toJSON());
      } else {
        res.sendStatus(httpStatus.NOT_FOUND);
      }
    })
    .catch(next);
}

function getEpisodes(req, res, next) {
  // TODO: Pagination
  Podcast
    .findById(req.params.id, 'episodes')
    .slice('episodes', [0, EPISODES_COUNT_LIMIT])
    .then(podcast => {
      if (podcast) {
        res.json(podcast.episodes);
      } else {
        res.sendStatus(httpStatus.NOT_FOUND);
      }
    })
    .catch(next);
}

export default {
  get,
  getEpisodes,
};
