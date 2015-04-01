var express = require('express');
var http = require('http');

var app = express();

var server = http.createSever(app).listen(3000);