const axios = require('axios');
const moment = require('moment');

class LastFm {
  constructor(config) {
    this.fetcher = axios.create({
      baseURL: config.url,
    });
    this.apiKey = config.apiKey;
    this.username = config.username;
  }

  fetchLastScrobbledTrack(username, limit, page, from, extended, to) {
    return this.fetcher.get('/', {
      params: {
        method: 'user.getRecentTracks',
        user: username,
        limit,
        page,
        from,
        extended,
        to,
        api_key: this.apiKey,
        format: 'json',
      },
    })
      .then(response => response.data);
  }

  getProfilePage() {
    return new URL(`https://last.fm/user/${this.username}`);
  }

  getCurrentPlayingSong() {
    return this.fetchLastScrobbledTrack(this.username, 1).then((body) => {
      const lastPlayed = body.recenttracks.track[0];
      if (lastPlayed) {
        const trackName = lastPlayed.name;
        const artistName = lastPlayed.artist['#text'];
        const nowPlaying = lastPlayed['@attr'] && lastPlayed['@attr'].nowplaying === 'true';

        if (nowPlaying) {
          return {
            trackName,
            artistName,
            nowPlaying,
          };
        }

        const lastPlayedTimestamp = moment.unix(lastPlayed.date.uts);
        const playedAgo = moment.duration(lastPlayedTimestamp.diff(moment()));

        return {
          trackName,
          artistName,
          playedAgo,
          nowPlaying,
        };
      }
      return null; // `No song has been scrobbled to ${this.getProfilePage()}`;
    }).catch((err) => {
      console.log(err);
    });
  }

  getPreviousSongPlaying() {
    return this.fetchLastScrobbledTrack(this.username, 2).then((body) => {
      const lastPlayed = body.recenttracks.track[0];
      const previouslyPlayed = body.recenttracks.track[1];
      if (lastPlayed && previouslyPlayed) {
        const nowPlaying = lastPlayed['@attr'] && lastPlayed['@attr'].nowplaying === 'true';
        const lastPlayedTrackName = lastPlayed.name;
        const lastPlayedArtistName = lastPlayed.artist['#text'];
        const lastPlayedTimestamp = nowPlaying ? moment() : moment.unix(lastPlayed.date.uts);
        const previouslyPlayedTrackName = previouslyPlayed.name;
        const previouslyPlayedArtistName = previouslyPlayed.artist['#text'];
        const previouslyPlayedTimestamp = moment.unix(previouslyPlayed.date.uts);
        const playedAgo = moment.duration(previouslyPlayedTimestamp
          .diff(lastPlayedTimestamp));
        return {
          lastPlayedTrackName,
          lastPlayedArtistName,
          previouslyPlayedArtistName,
          previouslyPlayedTrackName,
          playedAgo,
        };
      }
      return null;
    }).catch((err) => {
      console.log(err);
    });
  }
}

module.exports = LastFm;
