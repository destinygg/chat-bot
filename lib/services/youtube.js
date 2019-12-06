const _ = require('lodash');
const google = require('googleapis').google;  // eslint-disable-line


class YouTube {
  constructor(configuration) {
    this.configuration = configuration;
    this.scopes = ['https://www.googleapis.com/auth/youtube.readonly'];
    this.youtube = google.youtube({
      version: 'v3',
      auth: this.configuration.YOUTUBE_API_KEY,
    });
  }

  getLatestUploadedVideo() {
    return this.getListOfUploadedVideos().then(response => response.items[0]);
  }

  getListOfUploadedVideos() {
    return this.getChannelsUploadedPlaylistId(this.configuration.YOUTUBE_CHANNEL)
      .then(playlistId =>
        this.youtube.playlistItems.list({
          part: 'snippet, contentDetails',
          playlistId,
        }),
      )
      .then(response => response.data);
  }

  getChannelsUploadedPlaylistId(user) {
    return this.youtube.channels
      .list({
        forUsername: user,
        part: 'contentDetails',
      })
      .then(
        response =>
          _.find(response.data.items, ['kind', 'youtube#channel']).contentDetails.relatedPlaylists
            .uploads,
      );
  }
}

module.exports = YouTube;
