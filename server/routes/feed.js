import express from 'express';
import feedController from '../controllers/feed';

const router = express.Router();	// eslint-disable-line new-cap

router.route('/')
  .get(feedController.get);

export default router;
