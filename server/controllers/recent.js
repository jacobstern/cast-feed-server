import Podcast from '../models/podcast';

function post(req, res, next) {
  const podcastIds = req.body.podcastIds;

  Podcast
    .where('_id')
    .in(podcastIds)
    .select('episodes')
    .then(podcasts => {
      const result = {};

      podcasts.forEach(podcast => {
        const model = podcast.toObject();

        result[podcast.id] = model.episodes && model.episodes.slice(0, 4);
      });

      res.json(result);
    })
    .catch(next);
}

export default {
  post,
};
