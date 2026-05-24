const axios = require('axios').default;
const moment = require('moment');

class YouTube {
  constructor(config, log) {
    this.config = config;
    this.log = log;
  }

  getListOfUploadedVideos() {
    return axios
      .get(`${this.config.baseUrl}/api/info/videos`, {
        headers: { Accept: 'application/json' },
      })
      .then((res) => res.data.data);
  }

  getLatestUploadedVideo() {
    return this.getListOfUploadedVideos().then((videos) => videos[0]);
  }

  getChannelStatus() {
    return axios
      .get(`${this.config.baseUrl}/api/info/stream`, {
        headers: { Accept: 'application/json' },
      })
      .then((res) => res.data.data.streams.youtube)
      .then((yt) => {
        if (yt && yt.live) {
          return {
            timestamp: moment().unix(),
            isLive: true,
            viewers: yt.viewers,
            started: moment(yt.started_at, 'YYYY-MM-DDTHH:mm:ssZ'),
          };
        }
        return { timestamp: moment().unix(), isLive: false };
      });
  }

  getActiveLiveBroadcastsVideoId() {
    return axios
      .get(`${this.config.baseUrl}/api/info/stream`, {
        headers: { Accept: 'application/json' },
      })
      .then((res) => res.data.data.streams.youtube?.id ?? null);
  }
}

module.exports = YouTube;
