let WebSocketServer = require('websocket').server;
let https = require('https');
let port = 8081;

let fs = require('fs');
let pkey = fs.readFileSync("private.pem");
let pcert = fs.readFileSync("public.pem");
let serverOptions = {
    key: pkey,
    cert: pcert
};

let server = https.createServer(
    serverOptions,
    function (request, response) {
        console.log((new Date()) + ' Received request for ' + request.url);
        response.writeHead(404);
        response.end();
    });

server.listen(port, function () {
    console.log((new Date()) + ' Server is listening on port' + port);
});

let wsServer = new WebSocketServer({
    httpServer: server,
    ssl: true,
    key: pkey,
    cert: pcert
});

var members = [];

wsServer.on("request", function (request) {
    var ws = request.accept();
    let id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.log("connected, id "+ id);
    members.push({id, ws});
    handle_connection(id, ws);
    // connection.sendUTF(message.utf8Data);
    // console.log(message.utf8Data);
});



function handle_connection(id, ws) {
    // console.log("connected, "+members.length+" members");
    ws.on("message", data => {
        // console.log("echo: " + data);
        members.forEach(function(member) {
            if (member.id == id) return;
            member.ws.sendUTF(data.utf8Data);
        });
    })
    ws.close = function() {
        members.forEach(function(member) {
            if (member.id == id) {
                members.splice(members.indexOf(member), 1);
                console.log("disconnected, "+id);
                return;
            }
        });
    }
}
