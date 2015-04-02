var express = require('express');
var http = require('http');

var app = express();

require('./routes')(app);

var server = http.createSever(app).listen(3000);

exports = module.exports = app;