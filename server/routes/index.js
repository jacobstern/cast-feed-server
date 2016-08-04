import express from 'express';
import feedRoutes from './feed';
import podcastRoutes from './podcast';
import recentRoutes from './recent';

const router = express.Router();	// eslint-disable-line new-cap

router.use('/feed', feedRoutes);
router.use('/podcast', podcastRoutes);
router.use('/recent', recentRoutes);

export default router;
