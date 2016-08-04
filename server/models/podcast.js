import mongoose, { Schema } from 'mongoose';
import _ from 'lodash';

const serialize = {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id; // eslint-disable-line
    delete ret.__v; // eslint-disable-line
  },
};

const EpisodeSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  enclosure: {
    type: {
      url: { type: String, required: true },
      length: Number,
      mimeType: String,
    },
    required: true,
  },
  duration: Number,
  guid: { type: String, required: true },
  published: { type: Date, default: Date.now, index: true },
  explicit: String,
  block: String,
});

EpisodeSchema.set('toObject', serialize);
EpisodeSchema.set('toJSON', serialize);

const PodcastSchema = new Schema({
  // Application metadata
  feed: { type: String, required: true, index: true },
  // RSS properties
  title: { type: String, required: true },
  link: String,
  description: String,
  date: Date,
  image: String,
  image60: String,
  image100: String,
  image600: String,
  author: String,
  category: String,
  explicit: String,
  episodes: [EpisodeSchema],
  lang: String,
}, { timestamps: true });

PodcastSchema.pre('validate', function (next) {
  const episodes = this.episodes;
  this.episodes = episodes && _.sortBy(episodes, episode => -episode.published);
  this.date = this.date || (episodes && episodes[0] && episodes[0].published);

  next();
});

PodcastSchema.statics.findByFeed = function (url, project) {
  return this.findOne({ feed: url }, project);
};

PodcastSchema.set('toObject', serialize);
PodcastSchema.set('toJSON', serialize);

export default mongoose.model('Podcast', PodcastSchema);
