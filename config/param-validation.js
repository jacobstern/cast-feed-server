import Joi from 'joi';

export default {
  // GET /api/feed
  getFeed: {
    query: {
      url: Joi.string().required(),
    },
  },

  // POST /api/recent
  recent: {
    body: {
      podcastIds: Joi.array().required(),
    },
  },
};
