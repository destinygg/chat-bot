const assert = require('assert');
const normalizeUrl = require('../../../lib/chat-utils/normalize-url');

describe('normalizeUrl', () => {
  it('should normalize a URL with hostname and pathname', () => {
    const url = new URL('https://example.com/path/to/page');
    assert.strictEqual(normalizeUrl(url), 'example.com/path/to/page');
  });

  it('should normalize a URL with just hostname', () => {
    const url = new URL('https://example.com');
    assert.strictEqual(normalizeUrl(url), 'example.com/');
  });

  it('should normalize a URL with query parameters', () => {
    const url = new URL('https://example.com/path?param=value');
    assert.strictEqual(normalizeUrl(url), 'example.com/path');
  });

  it('should normalize a URL with hash fragment', () => {
    const url = new URL('https://example.com/path#section');
    assert.strictEqual(normalizeUrl(url), 'example.com/path');
  });

  it('should normalize a URL with subdomain', () => {
    const url = new URL('https://sub.example.com/path');
    assert.strictEqual(normalizeUrl(url), 'sub.example.com/path');
  });

  it('should normalize a URL with port number', () => {
    const url = new URL('https://example.com:8080/path');
    assert.strictEqual(normalizeUrl(url), 'example.com/path');
  });

  describe('YouTube URL normalization', () => {
    it('should normalize www.youtube.com URLs preserving video ID', () => {
      const url = new URL('https://www.youtube.com/watch?v=llZdkIMQdbM');
      assert.strictEqual(normalizeUrl(url), 'youtube.com/watch?v=llZdkIMQdbM');
    });

    it('should normalize youtube.com URLs preserving video ID', () => {
      const url = new URL('https://youtube.com/watch?v=llZdkIMQdbM');
      assert.strictEqual(normalizeUrl(url), 'youtube.com/watch?v=llZdkIMQdbM');
    });

    it('should normalize YouTube URLs with additional parameters', () => {
      const url = new URL('https://www.youtube.com/watch?v=llZdkIMQdbM&t=123&feature=share');
      assert.strictEqual(normalizeUrl(url), 'youtube.com/watch?v=llZdkIMQdbM');
    });

    it('should handle YouTube URLs without video ID', () => {
      const url = new URL('https://www.youtube.com/channel/UC123456');
      assert.strictEqual(normalizeUrl(url), 'www.youtube.com/channel/UC123456');
    });
  });
});
