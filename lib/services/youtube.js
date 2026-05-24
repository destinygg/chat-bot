const axios = require('axios').default;

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
}

module.exports = YouTube;
