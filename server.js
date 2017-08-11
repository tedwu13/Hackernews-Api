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
  const hacker_api = 'https://hacker-news.firebaseio.com/v0/topstories.json';
  const numStories = 1;
  request.get({
    'url': hacker_api,
    'json': true,
  }, function(err, response, body){
    const topStories = response.body.slice(0,numStories);
    async.forEach(topStories, fetchStory);

    res.json({ topStories });
  });
});

const fetchStory = (storyId) => {
  async.parallel([
    function(callback) {
      request.get({
        'url': 'https://hacker-news.firebaseio.com/v0/item/' + storyId + '.json?',
        'json': true,
      }, function(err, response, body){
        if(err) return callback(err);
        const comments = response.body.kids || 0;
        if(comments.length > 0) {
          console.log("first comments", comments);
          async.map(comments, fetchComments);
        }

        callback();
      });
    },
  ], function(err) { //This function gets called after the two tasks have called their "task callbacks"
    if (err) return next(err); //If an error occurred, we let express handle it by calling the `next` function
      //when both are done

  });
}

const fetchComments = (commentId) => {
  async.parallel([
    function(callback) {
      request.get({
        'url': 'https://hacker-news.firebaseio.com/v0/item/' + commentId + '.json?',
        'json': true,
      }, function(err, response, body){
        if(err) return callback(err);
        const comments = response.body.kids || 0;
        if(comments.length > 0) {
          // async.forEach(comments, fetchAndIncrementCount);
          console.log("comments", comments);
        }

        callback();
      });
    },
  ], function(err) { //This function gets called after the two tasks have called their "task callbacks"
    if (err) return next(err); //If an error occurred, we let express handle it by calling the `next` function
      //when both are done

  });
}

var port = process.env.PORT || 8080;
app.listen(port);
console.log("App listening on port " + port);
