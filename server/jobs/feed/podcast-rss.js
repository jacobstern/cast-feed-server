import request from 'request';
import FeedParser from 'feedparser';
import { Iconv } from 'iconv';
import _ from 'lodash';

/*
 * Source:
 * https://github.com/danmactough/node-feedparser/blob/master/examples/iconv.js
 */

/* eslint-disable */

function getParams(str) {
  var params = str.split(';').reduce(function (params, param) {
    var parts = param.split('=').map(function (part) { return part.trim(); });
    if (parts.length === 2) {
      params[parts[0]] = parts[1];
    }
    return params;
  }, {});
  return params;
}

function maybeTranslate (res, charset, reject) {
  var iconv;
  // Use iconv if its not utf8 already.
  if (!iconv && charset && !/utf-*8/i.test(charset)) {
    try {
      iconv = new Iconv(charset, 'utf-8');
      console.log('Converting from charset %s to utf-8', charset);
      iconv.on('error', reject);
      // If we're using iconv, stream will be the output of iconv
      // otherwise it will remain the output of request
      res = res.pipe(iconv);
    } catch(err) {
      res.emit('error', err);
    }
  }
  return res;
}

/* eslint-enable */

export function parseItunesDuration(duration) {
  if (!duration) {
    return undefined;
  }

  // http://lists.apple.com/archives/syndication-dev/2005/Nov/msg00002.html#_Toc526931683
  const parts = duration.split(':').slice(0, 3);
  let result = 0;
  let valueInSeconds = 1;

  parts.reverse().forEach(part => {
    const parsed = parseInt(part, 10);
    if (!isNaN(parsed)) {
      result += parsed * valueInSeconds;
    }

    valueInSeconds *= 60;
  });

  return result;
}

function fetch(feed, resolve, reject) {
  // Define our streams
  const req = request(feed, { timeout: 10000 });
  req.setMaxListeners(50);
  // Some feeds do not respond without user-agent and accept headers.
  req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
  req.setHeader('accept', 'text/html,application/xhtml+xml');

  const feedparser = new FeedParser();

  // Define our handlers
  req.on('error', reject);
  req.on('response', res => {
    if (res.statusCode !== 200) {
      reject(res.statusCode);
    }

    let stream = res;
    const charset = getParams(res.headers['content-type'] || '').charset;
    stream = maybeTranslate(stream, charset, reject);

    stream.pipe(feedparser);
  });

  const podcast = { episodes: [] };

  feedparser.on('error', reject);
  feedparser.on('end', () => resolve(podcast));
  feedparser.on('meta', () => {
    const { meta } = feedparser;

    podcast.feed = feed;
    podcast.title = meta.title;
    podcast.description = meta.description;
    podcast.date = meta.date;
    podcast.link = meta.link;
    podcast.image = meta.image && meta.image.url;
    podcast.author = _.get(meta, 'itunes:author.#') || meta.author;
    podcast.category = meta.categories && meta.categories[0];
    podcast.lang = meta.language;

    if (!podcast.title) {
      reject();
    }
  });
  feedparser.on('readable', () => {
    let done = false;
    while (!done) {
      const item = feedparser.read();

      if (item) {
        const enclosure = item.enclosures && item.enclosures[0];
        const { title, guid } = item;

        if (enclosure && title && guid) {
          const itunesDuration = _.get(item, 'itunes:duration.#');
          const episode = {
            title,
            description: item.description,
            enclosure: enclosure && {
              url: enclosure.url,
              length: enclosure.length,
              mimeType: enclosure.type,
            },
            guid,
            duration: itunesDuration && parseItunesDuration(itunesDuration),
            published: item.date || item.pubdate,
          };

          podcast.episodes.push(episode);
        }
      } else {
        done = true;
      }
    }
  });
}

export function getPodcastFromUrl(url) {
  return new Promise((resolve, reject) => fetch(url, resolve, reject));
}
