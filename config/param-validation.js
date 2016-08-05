import Joi from 'joi';

export default {
  // GET /feed
  getFeed: {
    query: {
      url: Joi.string().required(),
    },
  },

  // POST /recent
  recent: {
    body: {
      podcastIds: Joi.array().required(),
    },
  },
};
