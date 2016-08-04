import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import recentController from '../controllers/recent';

const router = express.Router();	// eslint-disable-line new-cap

router.route('/')
  .post(validate(paramValidation.recent), recentController.post);

export default router;
