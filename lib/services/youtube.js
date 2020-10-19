const _ = require('lodash');
const google = require('googleapis').google; // eslint-disable-line prefer-destructuring
const moment = require('moment');

class YouTube {
  constructor(configuration) {
    this.configuration = configuration;
    this.scopes = ['https://www.googleapis.com/auth/youtube.readonly'];
    this.youtube = google.youtube({
      version: 'v3',
      auth: this.configuration.YOUTUBE_API_KEY,
    });
    this.channelId = '';
    this.playlistId = '';
  }

  getLatestUploadedVideo() {
    return this.getListOfUploadedVideos().then((response) => response.items[0]);
  }

  getListOfUploadedVideos() {
    return this.getChannelsUploadedPlaylistId(this.configuration.YOUTUBE_CHANNEL)
      .then((playlistId) =>
        this.youtube.playlistItems.list({
          part: 'snippet, contentDetails',
          playlistId,
        }),
      )
      .then((response) => response.data);
  }

  getActiveLiveBroadcastsVideoId() {
    return this.getChannelIdFromUsername(this.configuration.YOUTUBE_CHANNEL)
      .then((channelId) =>
        this.youtube.search.list({
          channelId,
          eventType: 'live',
          type: 'video',
          part: 'snippet',
        }),
      )
      .then((response) => _.find(response.data.items, ['kind', 'youtube#searchResult']))
      .then((searchResult) => {
        if (searchResult && searchResult.id && searchResult.id.videoId) {
          return searchResult.id.videoId;
        }
        return null;
      });
  }

  getChannelStatus() {
    return this.getActiveLiveBroadcastsVideoId()
      .then((id) =>
        this.youtube.videos.list({
          id,
          part: 'liveStreamingDetails',
        }),
      )
      .then((response) => _.find(response.data.items, ['kind', 'youtube#video']))
      .then((searchResult) => {
        if (
          searchResult &&
          searchResult.liveStreamingDetails &&
          searchResult.liveStreamingDetails.concurrentViewers
        ) {
          return {
            isLive: true,
            viewers: searchResult.liveStreamingDetails.concurrentViewers,
            started: moment(
              searchResult.liveStreamingDetails.actualStartTime,
              'YYYY-MM-DDTHH:mm:ssZ',
            ),
          };
        }
        return {
          isLive: false,
        };
      });
  }

  getChannelsUploadedPlaylistId(user) {
    if (this.playlistId) {
      return Promise.resolve(this.playlistId);
    }
    return this.youtube.channels
      .list({
        forUsername: user,
        part: 'contentDetails',
      })
      .then(
        (response) =>
          _.find(response.data.items, ['kind', 'youtube#channel']).contentDetails.relatedPlaylists
            .uploads,
      )
      .then((playlistId) => {
        this.playlistId = playlistId;
        return this.playlistId;
      });
  }

  getChannelIdFromUsername(user) {
    if (this.channelId) {
      return Promise.resolve(this.channelId);
    }
    return this.youtube.channels
      .list({
        forUsername: user,
        part: 'id',
      })
      .then((response) => _.find(response.data.items, ['kind', 'youtube#channel']).id)
      .then((channelId) => {
        this.channelId = channelId;
        return this.channelId;
      });
  }
}

module.exports = YouTube;
