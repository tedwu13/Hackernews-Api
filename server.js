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
  const numStories = 2;
  request.get({
    'url': hacker_api,
    'json': true,
  }, function(err, response, body){
    const topStories = response.body.slice(0,numStories);
    console.log(topStories);
    async.map(topStories, fetchStory);

    res.json({ topStories });
  });
});

let finalDictionary = {};
let userDict = {};

const fetchStory = (id) => {
  let storyName;
  let user;
  async.series([
    function(callback) {
      // Fetch story by getting the initial comments
      request.get({
        'url': 'https://hacker-news.firebaseio.com/v0/item/' + id + '.json?',
        'json': true,
      }, function(err, response, body){
        if(err) return callback(err);
        // Check if children array is empty, if it is have a fallback value as 0
        const comments = response.body.kids || 0;
        user = response.body.by || 'No User';
        story = response.body.title || 'No Title';
        if(comments === 0) {
          // console.log("No comments");
        } else {
          // console.log("First comments", comments, response.body.title);
          if (user in userDict) {
              userDict[user] += 1;
          } else {
              userDict[user] = 1;
          }
          return async.map(comments, fetchStory, userDict);
        }
        callback();
      });
    },
  ], function(err) { //This function gets called after the two tasks have called their "task callbacks"
    if (err) return next(err); //If an error occurred, we let express handle it by calling the `next` function
      //when both are done
      console.log(userDict);
  });
}


var port = process.env.PORT || 8080;
app.listen(port);
console.log("App listening on port " + port);
