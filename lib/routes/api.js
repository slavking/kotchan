'use strict';

var express = require('express');
//var router = new express.Router();
var config = require('../../config');
var chat_db = require('../models/chat');
var send_sse = require('../utils/send-sse');


//console.log(global.APP);

const AGGREGATE_BOARD_FIELDS = Object.fromEntries(config.board_fields.split(' ').map(key => [key, `$${key}`]))

global.APP.get('/data:ops((?:_convo)?)/:id([a-z0-9]+):convo((?:_\\S+)?)', function (req, res) {
    if (req.params.id !== 'all' && config.boards.indexOf(req.params.id) < 0) {
        return res.send('Does not exist :(');
    }
    var search = {deleted:false};
    var limit = req.query.limit?parseInt(req.query.limit):100; 
   if (isNaN(limit) || limit < 1 || limit > config.max_posts) limit=100;
    var fields = '';
    if (req.params.id === 'all') {
        fields = config.all_fields;
    } else if (req.params.convo) {
    	search.convo = decodeURI(req.params.convo.slice(1));
    	console.log("\n\n", search.convo, "\n\n");
    	search.chat = req.params.id;
        fields = config.board_fields;
    } else {
        search.chat = req.params.id;
        fields = config.board_fields;
    }
    if (req.params.ops === '_convo') {
        search.is_convo_op = true;
        limit = 15;
    }

  new Promise(async (resolve) => {
    let results = []
    for await (const post of chat_db.aggregate([
      {"$match": search},
      {"$group": {_id: "$convo", posts: {"$push": AGGREGATE_BOARD_FIELDS }}},
      {"$sort": {"posts.count": -1}},
      {"$limit": config.max_convos},
      {"$project": {
        posts: {
          '$slice': ["$posts", -1 * limit],
        }
      }},
      {"$unwind": "$posts"},
      {"$replaceRoot": {newRoot: "$posts"}},
      {"$sort": {count: -1}},
    ])) {
      results.push(post)
    }
    resolve(results)
  }).then((results) => res.json(results))
});

global.APP.get('/last/:id([a-z0-9]+)', function (req, res) {

    // maybe long polling would work better
    if (config.boards.indexOf(req.params.id) < 0) {
        return res.send('Does not exist :(');
    }
    var search = {chat:req.params.id, deleted:false};
    if (req.query.convo) {
        search.convo = req.query.convo; // || 'General';
    }
    var limit = parseInt(req.query.limit);
    if (isNaN(limit)) limit = 50;
    var fields = config.board_fields;
    var count = parseInt(req.query.count);
    if (count && !isNaN(count)) search.count = {'$gt': count};

    chat_db.find(search)
        .sort({
            count: -1
        })
        .select(fields)
        .limit(limit)
        .exec(function (e, d) {
            if (!e) {
                res.json(d);
            } else {
                res.send('db_error');
            }
        });
});

/*
function sse_updates(req, res) {
    var handshakeInterval = setInterval(function(){
        res.write(': sse-handshake');
    }, 3000);

    var message_id = 0;
    res.sse = function(evt, json) {
        res.write('\n');
        res.write('id: '+message_id+'\n');
        message_id += 1;

        res.write('retry: 3000\n');
        res.write('event: '+evt+'\n');
        res.write('data: '+JSON.stringify(json)+'\n\n');

    };
    send_sse.users.push(res);
    res.on('finish', function() { clearInterval(handshakeInterval);send_sse.remove(res);console.log('close');});
    res.on('close', function() { clearInterval(handshakeInterval);send_sse.remove(res);console.log('close');});

}

router.get('/updates', function(req, res) {
    req.socket.setTimeout(Number.MAX_VALUE);

    res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Content-Encoding': 'identity'
  });

    //res.write('\n');


    sse_updates(req, res);
    res.sse('connected', {
      welcomeMsg: 'Welcome to psychotronic prison'
    });
});
 */

