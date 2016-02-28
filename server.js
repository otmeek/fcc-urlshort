'use strict';

var express = require('express');
var mongoose = require('mongoose');
var path = require('path');
var mongo = require('mongodb').MongoClient;
var validUrl = require('valid-url');

var app = express();
require('dotenv').load();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/:URL', function(req, res) {
	var url = req.params.URL;
	var obj;
	
	mongo.connect('mongodb://localhost:27017/urls', function(err, db) {
		if(err) throw err;
		
		var values = db.collection('values');
		
		values.find({
			"short_url": 'https://fcc-urlshort-otmeek.c9users.io/' + url 
		}, {
			"original_url": 1
		}).toArray(function(err, docs) {
			if(err) throw err;
			if(docs.length > 0) {
				var dest = docs[0]["original_url"];
				res.writeHead(301, {
					Location: dest
				});
				res.end();
				db.close();
			}
			else {
				obj = {
					"error": "No short url found for given input"
				}
				res.send(obj);
				db.close();
			}
		});
	});
		
});

app.get('/new*', function(req, res) {
	var originalUrl = req.path.substring("/new/".length);
	var newUrl = '';
	var obj;
		
	mongo.connect('mongodb://localhost:27017/urls', function(err, db) {
		if (err) throw err;
		
		var counter = db.collection('counter');
		var values = db.collection('values');
		
		// generate url
		function getNewUrl() {
			var randomNo = Math.round(Math.random() * (9999 - 0) + 0);
			newUrl = 'https://fcc-urlshort-otmeek.c9users.io/' + randomNo.toString();
			values.find({
				"short_url": newUrl
			}, {
				"original_url": 1,
				"short_url": 1,
				_id: 0
			}).toArray(function(err, docs) {
				if (err) throw err;
				if(docs.length > 0)
					getNewUrl();
			});
			return newUrl;
		}
		
		// first, check if url has already been shortened
		values.find({
			"original_url": originalUrl
		}, {
			"original_url": 1,
			"short_url": 1,
			_id: 0
		}).toArray(function (err, docs) {
			if(err) throw err;
			if(docs.length > 0) {
				obj = docs;
				console.log(obj);
				res.send(obj[0]);
				db.close();
			}
			else {
				if(validUrl.isUri(originalUrl)) {
					// write to db
					values.insert({
						"original_url": originalUrl,
						"short_url": getNewUrl()
					}, function(err) {
						if (err) throw err;
						values.find({
							"original_url": originalUrl
						}, {
							"original_url": 1,
							"short_url": 1,
							_id: 0
						}).toArray(function(err, docs) {
							if (err) throw err;
							res.send(docs[0]);
							db.close();
						})
					});
				}
				else {
					// url is not valid
					obj = {
						"error": "invalid URL"
					}
					res.send(obj);
					db.close();
				}
			}
		})
		
	});

});

app.get('/:URLSTRING', function(req, res) {
	var urlStr = req.params.URLSTRING;
	
	// check if urlStr is in database
});

var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});