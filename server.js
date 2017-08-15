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
  const numStories = 10;
  request.get({
    'url': hacker_api,
    'json': true,
  }, function(err, response, body){
    const topStories = response.body.slice(0,numStories);
    async.map(topStories, fetchStorySetup);
    // fetchStorySetup('15014757');

    res.json({ topStories });
  });
});

const fetchStorySetup = (id) => {
  let dict = {};
  let allComments = [];
  
  let topCommentsPromise = getTopCommentsForTopic(id);
  Promise.resolve(topCommentsPromise).then(function(topComments) {
    let traversePromises = [];
    topComments.children.forEach(function(topCommentId) {
      traversePromises.push(traverse(topCommentId, dict, allComments));
    });
    Promise.all(traversePromises).then(function() {
      let sum = 0;
      for (var key in dict) {
        if (dict.hasOwnProperty(key)) {
          sum += dict[key];
        }
      }
      console.log(dict);
      console.log(sum);
      // console.log(allComments);
    })
  });

  // let traversalPromise = traverse(id, allComments);
  // Promise.resolve(traversalPromise).then(function() {
  //   console.log(allComments);
  // });
}

function getTopCommentsForTopic(topic_id) {
  return new Promise((resolve, reject) => {
    request.get({
    'url': 'https://hacker-news.firebaseio.com/v0/item/' + topic_id + '.json?',
    'json': true,
    }, function(err, response, body) {
      if (err) reject(err);
      return resolve({children: body.kids});
    });
  });
}

function traverse(commentId, dict, allComments) {
  return new Promise((resolve, reject) => {
    let getCommentPromise = fetch_comment(commentId);
    Promise.resolve(getCommentPromise).then(function(comment) {

      // add stuff
      let author = comment.author;
      if (author) {
        if (author in dict) {
          dict[author] += 1;
        } else {
          dict[author] = 1;
        }
      }
      allComments.push(comment);

      if (comment.children.length === 0) {
        resolve();
      } else {
        let traversePromises = []
        comment.children.forEach(function(childId) {
          traversePromises.push(traverse(childId, dict, allComments));
        });
        Promise.all(traversePromises).then(function() {
          resolve();
        })
      }
    });
  });
};

function fetch_comment(comment_id, callback) {
  // console.log("Fetching " + comment_id);
  return new Promise((resolve, reject) => {
    request.get({
      'url': 'https://hacker-news.firebaseio.com/v0/item/' + comment_id + '.json?',
      'json': true,
    }, function(err, response, body) {
      if (err) {
        reject(err);
      }
      let author = body.by;
      let children = body.kids === undefined ? [] : body.kids;
      resolve({author: author, children: children})
    });
  })
}

var port = process.env.PORT || 8080;
app.listen(port);
console.log("App listening on port " + port);
