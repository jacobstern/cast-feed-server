import bluebird from 'bluebird';
import redis from 'redis';
import kue from 'kue';
import winston from 'winston';
import { JOB_STATUS_PENDING, JOB_STATUS_ERROR, JOB_TYPE_FEED_RETRIEVAL } from './constants';
import processPodcastFeed from './feed/process-podcast-feed';

bluebird.promisifyAll(redis.RedisClient.prototype);

const JOBS_FAILED_EXPIRY = 300;
const JOBS_TTL = 600000;
const NUM_CONCURRENT_JOBS = 4;

const client = redis.createClient()
  .on('error', winston.error);

function wrapJobResult(result, done) {
  result
    .then(() => {
      done();
    })
    .catch(err => {
      if (err instanceof Error) {
        done(err);
      } else {
        const error = new Error(err || 'Error in job');
        done(error);
      }
    });
}

function removeFinishedJob(id) {
  kue.Job.get(id, (err, job) => {
    if (!err) {
      job.remove();
    }
  });
}

const queue = kue.createQueue();
queue
  .on('error', winston.error)
  .on('job complete', removeFinishedJob)
  .on('job failed', removeFinishedJob)
	.process(JOB_TYPE_FEED_RETRIEVAL, NUM_CONCURRENT_JOBS, (job, done) => {
  wrapJobResult(processPodcastFeed(job.data.feed), done);
});

function doJob(jobType, id, data) {
  const key = `cast-feed:${jobType}:${id}`;

  return client.getAsync(key).then(result => {
    if (result) {
      return result;
    }

    // Set a timeout in case the job fails to complete. This is still bad because we are leaking
    // job entries, but at least we can try to retrieve the same feed again.
    client.set([key, JOB_STATUS_PENDING, 'ex', JOBS_TTL]);

    const job = queue.create(jobType, data)
      .on('complete', () => {
        winston.info(`Job completed with id: ${job.id}`);
        client.del(key);
      })
      .on('failed', err => {
        winston.error(`Job failed: ${err}`);
        client.set([key, JOB_STATUS_ERROR, 'ex', JOBS_FAILED_EXPIRY]);
      })
      .ttl(JOBS_TTL)
      .save();
  });
}

function doProcessPodcastFeed(feed) {
  return doJob(JOB_TYPE_FEED_RETRIEVAL, feed, {
    title: `Retrieve feed ${feed}`,
    feed,
  });
}

export default {
  doProcessPodcastFeed,
};
