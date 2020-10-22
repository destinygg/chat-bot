const _ = require('lodash');
const { google } = require('googleapis');
const moment = require('moment');

class YouTube {
  constructor(configuration) {
    this.configuration = configuration;
    this.scopes = ['https://www.googleapis.com/auth/youtube.readonly'];
    this.youtube = google.youtube({
      version: 'v3',
      auth: this.configuration.YOUTUBE_API_KEY,
    });
    this.etags = {};
  }

  getLatestUploadedVideo() {
    return this.getListOfUploadedVideos().then((response) => response.items[0]);
  }

  getListOfUploadedVideos() {
    const key = 'getListOfUploadedVideos';
    return this.getChannelsUploadedPlaylistId(this.configuration.YOUTUBE_CHANNEL)
      .then((playlistId) =>
        this.youtube.playlistItems.list(
          {
            part: ['snippet', 'contentDetails'],
            playlistId,
          },
          { headers: this.addEtagHeader(key) },
        ),
      )
      .then((response) => this.cacheResponse(key, response))
      .then((response) => response.data);
  }

  getActiveLiveBroadcastsVideoId() {
    const key = 'getActiveLiveBroadcastsVideoId';
    return this.getChannelIdFromUsername(this.configuration.YOUTUBE_CHANNEL)
      .then((channelId) =>
        this.youtube.search.list(
          {
            channelId,
            eventType: 'live',
            type: ['video'],
            part: ['snippet'],
          },
          { headers: this.addEtagHeader(key) },
        ),
      )
      .then((response) => this.cacheResponse(key, response))
      .then((response) => _.find(response.data.items, ['kind', 'youtube#searchResult']))
      .then((searchResult) => {
        if (searchResult && searchResult.id && searchResult.id.videoId) {
          return searchResult.id.videoId;
        }
        return null;
      });
  }

  getChannelStatus() {
    const key = 'getChannelStatus';
    return this.getActiveLiveBroadcastsVideoId()
      .then((id) =>
        this.youtube.videos.list(
          {
            id: [id],
            part: ['liveStreamingDetails'],
          },
          { headers: this.addEtagHeader(key) },
        ),
      )
      .then((response) => this.cacheResponse(key, response))
      .then((response) => _.find(response.data.items, ['kind', 'youtube#video']))
      .then((searchResult) => {
        if (
          searchResult &&
          searchResult.liveStreamingDetails &&
          searchResult.liveStreamingDetails.concurrentViewers
        ) {
          return {
            timestamp: moment().unix(),
            isLive: true,
            viewers: searchResult.liveStreamingDetails.concurrentViewers,
            started: moment(
              searchResult.liveStreamingDetails.actualStartTime,
              'YYYY-MM-DDTHH:mm:ssZ',
            ),
          };
        }
        return {
          timestamp: moment().unix(),
          isLive: false,
        };
      });
  }

  getChannelsUploadedPlaylistId(user) {
    const key = 'getChannelsUploadedPlaylistId';
    return this.youtube.channels
      .list(
        {
          forUsername: user,
          part: ['contentDetails'],
        },
        { headers: this.addEtagHeader(key) },
      )
      .then((response) => this.cacheResponse(key, response))
      .then(
        (response) =>
          _.find(response.data.items, ['kind', 'youtube#channel']).contentDetails.relatedPlaylists
            .uploads,
      );
  }

  getChannelIdFromUsername(user) {
    const key = 'getChannelIdFromUsername';
    return this.youtube.channels
      .list(
        {
          forUsername: user,
          part: ['id'],
        },
        { headers: this.addEtagHeader(key) },
      )
      .then((response) => this.cacheResponse(key, response))
      .then((response) => _.find(response.data.items, ['kind', 'youtube#channel']).id);
  }

  /**
   * @param {string} key
   * @param {T} response
   * @returns {T}
   * @template {import("gaxios").GaxiosResponse} T
   */
  cacheResponse(key, response) {
    if (response.status === 304) {
      return this.etags[key];
    }
    this.etags[key] = response;
    return response;
  }

  getEtag(key) {
    const response = this.etags[key];
    if (response && response.data && response.data.etag) {
      return response.data.etag;
    }
    return null;
  }

  addEtagHeader(key, headers = {}) {
    const etag = this.getEtag(key);
    if (etag) {
      return Object.assign(headers, { 'If-None-Match': etag });
    }
    return headers;
  }
}

module.exports = YouTube;
