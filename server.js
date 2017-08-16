const express = require('express');
const morgan  = require('morgan');
const dotenv = require('dotenv').config();
const async = require('async');
const request = require('request');
const _ = require('lodash');
const Table = require('cli-table');


const app = express();
app.use(morgan('dev'));


app.get('/topstories', function(req, res) {
  const hacker_api = 'https://hacker-news.firebaseio.com/v0/topstories.json';
  const numStories = 30;
  request.get({
    'url': hacker_api,
    'json': true,
  }, function(err, response, body){
    const topStories = response.body.slice(0,numStories);
    const storyPromises = topStories.map(fetchStories)
    Promise.all(storyPromises).then(values => {
      createTable(values); 
      res.json({ data: values }); 
    }).catch(reason => { 
      console.log(reason);
    });
  });
});

function fetchStories(story_id) {
  let finalDictionary = {};
  let topicTitle = getTopicTitle(story_id);
  let userDictionary = fetchStoryComments(story_id);
  let promisesQueue = [topicTitle, userDictionary];

  return Promise.all(promisesQueue).then(values => { 
    const title = values[0].title;
    const userDict = values[1];
    const sortedUserArray = sortUserDict(userDict);
    finalDictionary[title] = sortedUserArray.slice(0,10);
    return finalDictionary
  }).catch(error => {
    console.log(error);    
  });

}
function createTable(data) {
  const storyNames = _.flatten(_.map(data, function(data) {
    return _.keys(data);
  }));

  const userNamesData = _.map(data, function(data) {
    const values = _.flatten(_.values(data));
    return values.map(function(value) {
      return value['key'] + "- (" + value['value'] + " comments)";
    });
  });

  var table = new Table({ head: ["Story", "1st Commenter", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"] });
  
  for(var i = 0; i < storyNames.length; i++) {
    let tableData = {};
    tableData[storyNames[i]] = userNamesData[i];
    table.push(tableData);
  }
   
  console.log(table.toString());
}

function sortUserDict(userDict) {
    var userArray = [];
    var property;
    for (property in userDict) {
      if (userDict.hasOwnProperty(property)) {
        userArray.push({
            'key': property,
            'value': userDict[property]
        });
      }
    }
    userArray.sort(function(a, b) {
        return b.value - a.value;
    });
    return userArray;
}


function fetchStoryComments(id) {
  let dict = {};
  let allComments = [];

  let topCommentsPromise = getTopCommentsForTopic(id);

  return Promise.resolve(topCommentsPromise).then(function(topComments) {
    let traversePromises = [];
    if(topComments.children !== undefined){
      topComments.children.forEach(function(topCommentId) {
        traversePromises.push(traverse(topCommentId, dict, allComments));
      });
    }
    
    return Promise.all(traversePromises).then(function() {
      let sum = 0;
      for (var key in dict) {
        if (dict.hasOwnProperty(key)) {
          sum += dict[key];
        }
      }
      return dict;
    })
  });
}

function getTopicTitle(topic_id) {
  return new Promise((resolve, reject) => {
    request.get({
    'url': 'https://hacker-news.firebaseio.com/v0/item/' + topic_id + '.json?',
    'json': true,
    }, function(err, response, body) {
      if (err) reject(err);
      return resolve({ title: body.title });
    });
  });
}

function getTopCommentsForTopic(topic_id) {
  return new Promise((resolve, reject) => {
    request.get({
    'url': 'https://hacker-news.firebaseio.com/v0/item/' + topic_id + '.json?',
    'json': true,
    }, function(err, response, body) {
      if (err) reject(err);
      return resolve({ children : body.kids });
    });
  });
}

function traverse(commentId, dict, allComments) {
  return new Promise((resolve, reject) => {
    let getCommentPromise = fetchComment(commentId);
    Promise.resolve(getCommentPromise).then(function(comment) {

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

function fetchComment(commentId, callback) {
  return new Promise((resolve, reject) => {
    request.get({
      'url': 'https://hacker-news.firebaseio.com/v0/item/' + commentId + '.json?',
      'json': true,
    }, function(err, response, body) {
      if (err) {
        reject(err);
      }
      if(body !== undefined) {
        const author = body.by;
        const children = body.kids === undefined ? [] : body.kids;
        resolve({ author : author, children : children })
      }
    });
  })
}

var port = process.env.PORT || 8080;
app.listen(port);
console.log("App listening on port " + port);
