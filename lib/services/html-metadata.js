const axios = require('axios').default;
const moment = require('moment');
const datehandler = require('metascraper-date');
const metascraper = require('metascraper');

class HTMLMetadata {
  constructor() {
    this.fetcher = axios.create();
    this.scraper = metascraper([datehandler()]);
  }

  getOpenGraphDate(url) {
    return this.fetcher
      .get(url)
      .then((response) => {
        return this.scraper({ url: response.config.url, html: response.data });
      })
      .then((metadata) => {
        const date = moment(metadata.date);
        if (date.isValid()) {
          return date;
        }
        throw new Error(`No date found`);
      });
  }

  getLinkDatetime(url) {
    return this.getOpenGraphDate(url);
  }
}

module.exports = HTMLMetadata;
