# Hackernews data aggregator

For example, let's consider just 3 top stories (instead of 30) and top 2 commenters (instead of 10):

| Story A            | Story B             | Story C             |
|--------------------|---------------------|---------------------|
| user-a (1 comment) | user-a (4 comments) | user-a (4 comments) |
| user-b (2 comment) | user-b (3 comments) | user-b (5 comments) |
| user-c (3 comment) | user-c (2 comments) | user-c (3 comments) |

The result would be:

| Story   | 1st Top Commenter               | 2nd Top Commenter               |
|---------|---------------------------------|---------------------------------|
| Story A | user-c (3 for story - 8 total)  | user-b (2 for story - 10 total) |
| Story B | user-a (4 for story - 9 total)  | user-b (3 for story - 10 total) |
| Story C | user-b (5 for story - 10 total) | user-a (4 for story - 9 total)  |

Libaries used:

-Nodemon to restart the node server while watching your files and detecting changes when saving file
-Request node module for simplified http calls (https://github.com/request/request)
-Cli-table to have command line tables (https://github.com/Automattic/cli-table)
