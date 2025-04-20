require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const shortId = require('shortid');
const bodyParser = require('body-parser');
const validUrl = require('valid-url');
const req = require('express/lib/request');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded(
  {
    extended: false
  }
));
app.use(cors());
app.use(express.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', urlShortenerHandler);
app.get('/api/shorturl/:short_url?', shortUrlHandler);

const urlStore = {
  count: 0,
  store: new Map(),
  reverseStore: new Map(),

  add(key, value) {
    this.store.set(`${key}`, value);
    this.reverseStore.set(value, `${key}`);
    this.count++;
  },

  getShortUrl(value) {
    return this.reverseStore.get(value) || null;
  }
};


function urlShortenerHandler(req, res) {

  let { url } = req.body;
  url_parsed = url.split("//")[1] || null;

  if (!url_parsed) {
    res.json({ 'error': 'invalid url' });
  } else {
    const hostname = new URL(url).hostname;
    dns.lookup(hostname, (err) => {
      if (err) {
        res.json({ 'error': 'invalid url' });
      } else {
        const existingShortUrl = urlStore.getShortUrl(url);

        if (existingShortUrl) {
          res.json({ 'original_url': url, 'short_url': existingShortUrl });
        } else {
          const short_url = urlStore.count + 1;
          urlStore.add(short_url, url);
          res.json({ 'original_url': url, 'short_url': short_url });
        }
      }
    });
  }
}

function shortUrlHandler(req, res) {
  let { short_url } = req.params;
  const originalUrl = urlStore.store.get(short_url) || null;

  if (originalUrl) {
    // Redirect to the original URL
    res.redirect(originalUrl);
  } else {
    // Short URL not found
    res.status(404).json({ error: 'Resource not found' });
  }
}

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
