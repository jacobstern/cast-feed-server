import express from 'express';
import podcastController from '../controllers/podcast';

const router = express.Router();	// eslint-disable-line new-cap

router.route('/:id')
  .get(podcastController.get);

router.route('/:id/episodes')
  .get(podcastController.getEpisodes);

export default router;
