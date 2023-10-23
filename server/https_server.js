var os = require('os');
var nodeStatic = require('node-static');
var http = require('https');
var socketIO = require('socket.io');
var port = 50443;
const fs = require('fs');
const options = {
    key: fs.readFileSync('./private.pem'),
    cert: fs.readFileSync('./public.pem')
};
var fileServer = new (nodeStatic.Server)();
var app = http.createServer(options, function (req, res) {
    console.log("create server");
    fileServer.serve(req, res);
}).listen(port);
