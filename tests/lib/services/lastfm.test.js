const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment');
const LastFm = require('../../../lib/services/lastfm');


const hasNowPlaying = {'recenttracks':{'track':[{'artist':{'#text':'Antti Martikainen','mbid':''},'name':'One Against the World','streamable':'0','mbid':'','album':{'#text':'Synthesia','mbid':''},'url':'https://www.last.fm/music/Antti+Martikainen/_/One+Against+the+World','image':[{'#text':'https://lastfm-img2.akamaized.net/i/u/34s/b1b4374ad7c55d598ac721db4522c26d.png','size':'small'},{'#text':'https://lastfm-img2.akamaized.net/i/u/64s/b1b4374ad7c55d598ac721db4522c26d.png','size':'medium'},{'#text':'https://lastfm-img2.akamaized.net/i/u/174s/b1b4374ad7c55d598ac721db4522c26d.png','size':'large'},{'#text':'https://lastfm-img2.akamaized.net/i/u/300x300/b1b4374ad7c55d598ac721db4522c26d.png','size':'extralarge'}],'@attr':{'nowplaying':'true'}},{'artist':{'#text':'LiquidCinema','mbid':''},'name':'Veil','streamable':'0','mbid':'','album':{'#text':'Ember','mbid':''},'url':'https://www.last.fm/music/LiquidCinema/_/Veil','image':[{'#text':'','size':'small'},{'#text':'','size':'medium'},{'#text':'','size':'large'},{'#text':'','size':'extralarge'}],'date':{'uts':'1540200578','#text':'22 Oct 2018, 09:29'}},{'artist':{'#text':'PostHaste Music','mbid':'52024b5f-549d-45b3-ab5c-97b0558e7079'},'name':'From Within','streamable':'0','mbid':'','album':{'#text':'PHM Presents: Best of Mark Petrie','mbid':''},'url':'https://www.last.fm/music/PostHaste+Music/_/From+Within','image':[{'#text':'https://lastfm-img2.akamaized.net/i/u/34s/bbd55cb590dbac7f8e6123a105e8ae2d.png','size':'small'},{'#text':'https://lastfm-img2.akamaized.net/i/u/64s/bbd55cb590dbac7f8e6123a105e8ae2d.png','size':'medium'},{'#text':'https://lastfm-img2.akamaized.net/i/u/174s/bbd55cb590dbac7f8e6123a105e8ae2d.png','size':'large'},{'#text':'https://lastfm-img2.akamaized.net/i/u/300x300/bbd55cb590dbac7f8e6123a105e8ae2d.png','size':'extralarge'}],'date':{'uts':'1540200412','#text':'22 Oct 2018, 09:26'}}],'@attr':{'user':'dotted1337','page':'1','perPage':'2','totalPages':'24917','total':'49834'}}};
const hasNoNowPlaying = {'recenttracks':{'track':[{'artist':{'#text':'LiquidCinema','mbid':''},'name':'Dawnbringer','streamable':'0','mbid':'','album':{'#text':'Cinematic Apocalypse 4','mbid':''},'url':'https://www.last.fm/music/LiquidCinema/_/Dawnbringer','image':[{'#text':'','size':'small'},{'#text':'','size':'medium'},{'#text':'','size':'large'},{'#text':'','size':'extralarge'}],'date':{'uts':'1540202936','#text':'22 Oct 2018, 10:08'}},{'artist':{'#text':'Epic North','mbid':'ddfb36a9-fd1c-4c5a-89c0-a3385e74d372'},'name':'Stratosphere','streamable':'0','mbid':'','album':{'#text':'Mammoth','mbid':''},'url':'https://www.last.fm/music/Epic+North/_/Stratosphere','image':[{'#text':'https://lastfm-img2.akamaized.net/i/u/34s/e6cc086465b88ede1db5af8993d0b0ee.png','size':'small'},{'#text':'https://lastfm-img2.akamaized.net/i/u/64s/e6cc086465b88ede1db5af8993d0b0ee.png','size':'medium'},{'#text':'https://lastfm-img2.akamaized.net/i/u/174s/e6cc086465b88ede1db5af8993d0b0ee.png','size':'large'},{'#text':'https://lastfm-img2.akamaized.net/i/u/300x300/e6cc086465b88ede1db5af8993d0b0ee.png','size':'extralarge'}],'date':{'uts':'1540202795','#text':'22 Oct 2018, 10:06'}}],'@attr':{'user':'dotted1337','page':'1','perPage':'2','totalPages':'24923','total':'49846'}}};

describe('LastFm tests ', () => {

  beforeEach(function () {
    this.clock = sinon.useFakeTimers(1540203694586);
  });

  afterEach(function () {
    this.clock.restore();
  });

  it('can parse last.fm result with a currently playing track', (done) => {
    const lastFm = new LastFm({url: 'https://destiny.gg/nice/meme', apiKey: 'Big win in the marketplace of ideas', username: 'dotted1337'});
    
    lastFm.fetchLastScrobbledTrack = () => {
      return Promise.resolve(hasNowPlaying);
    }

    lastFm.getCurrentPlayingSong().then((result) => {
      assert.deepStrictEqual(result, {
        trackName: 'One Against the World',
        artistName: 'Antti Martikainen',
        nowPlaying: true
      });
      done();
    })
  });

  it('can parse last.fm result with no currently playing track', (done) => {
    const lastFm = new LastFm({url: 'https://destiny.gg/nice/meme', apiKey: 'Big win in the marketplace of ideas', username: 'dotted1337'});
    
    lastFm.fetchLastScrobbledTrack = () => {
      return Promise.resolve(hasNoNowPlaying);
    }
    
    lastFm.getCurrentPlayingSong().then((result) => {
      assert.deepStrictEqual(result, {
        trackName: 'Dawnbringer',
        artistName: 'LiquidCinema',
        nowPlaying: undefined,
        playedAgo: moment.duration(-758586),
      });
      done();
    })
  });

  it('can parse last.fm result and return the past played song', (done) => {
    const lastFm = new LastFm({url: 'https://destiny.gg/nice/meme', apiKey: 'Big win in the marketplace of ideas', username: 'dotted1337'});
    
    lastFm.fetchLastScrobbledTrack = () => {
      return Promise.resolve(hasNoNowPlaying);
    }

    lastFm.getPreviousSongPlaying().then((result => {
      assert.deepStrictEqual(result, {
        lastPlayedTrackName: 'Dawnbringer',
        lastPlayedArtistName: 'LiquidCinema',
        previouslyPlayedTrackName: 'Stratosphere',
        previouslyPlayedArtistName: 'Epic North',
        playedAgo: moment.duration(-141000),
      });
      done();
    }))
  });

  it('creates a profile page url', () => {
    const lastFm = new LastFm({url: 'https://destiny.gg/nice/meme', apiKey: 'Big win in the marketplace of ideas', username: 'dotted1337'});
    const result = lastFm.getProfilePage();
    assert.deepStrictEqual(result, new URL('https://last.fm/user/dotted1337'))
  });
});  