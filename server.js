const express = require('express');
const morgan  = require('morgan');
const dotenv = require('dotenv').config();
const async = require('async');
const request = require('request');
const _ = require('lodash');
const utils = require("./helpers/parser");

const app = express();
app.use(morgan('dev'));

app.get('/topstories', function(req, res) {
  const api = 'https://hacker-news.firebaseio.com/v0/topstories.json';
  const numStories = 30;
  request.get({
    'url': api,
    'json': true,
  }, function(err, response, body){
    const topStories = response.body.slice(0,30);
    res.json({ topStories });
  });
});


var port = process.env.PORT || 8080;
app.listen(port);
console.log("App listening on port " + port);
