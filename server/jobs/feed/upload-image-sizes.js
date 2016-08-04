import request from 'request';
import sharp from 'sharp';
import gcloud from 'gcloud';
import uuid from 'uuid';

let bucket;

function upload(stream) {
  if (!bucket) {
    bucket = gcloud.storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials: {
        private_key: process.env.GCS_PRIVATE_KEY,
        client_email: process.env.GCS_CLIENT_EMAIL,
      },
    }).bucket('cast-feed');
  }

  const id = uuid.v4();
  const file = bucket.file(id);

  return new Promise((resolve, reject) => {
    stream.pipe(file.createWriteStream({
      metadata: {
        contentType: 'image/jpeg',
      },
    })
      .on('error', reject)
      .on('finish', () => resolve(`https://storage.googleapis.com/cast-feed/${id}`))
    );
  });
}

function createImageStream(buffer, width) {
  return sharp(buffer)
    .resize(width, null, {
      kernel: sharp.kernel.lanczos2,
      interpolator: sharp.interpolator.nohalo,
    })
    .jpeg();
}

function getImageBuffer(url) {
  return new Promise((resolve, reject) => {
    request({ url, encoding: null }, (error, response, buffer) => {
      if (error) {
        reject(error);
      } else {
        resolve(buffer);
      }
    });
  });
}

export default function uploadImageSizes(url, dimensions) {
  if (!url) {
    return null;
  }

  return getImageBuffer(url)
    .then(buffer => Promise.all(dimensions.map(width =>
      upload(createImageStream(buffer, width))
    )));
}
