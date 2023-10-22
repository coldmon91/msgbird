const { WebSocketServer } = require("ws")
const wss = new WebSocketServer({ port: 8081 })

class User {
    constructor(ws, id) {
        this.ws = ws;
        this.id = id;
    }
    
}
var members = [];

function handle_connection(id, ws) {
    console.log("connected, "+members.length+" members");
    ws.on("message", data => {
        // console.log("echo: " + data);
        members.forEach(function(member) {
            if (member.id == id) return;
            // var trmsg = JSON.stringify({
            //     id:id.toString(),
            //     msg:data.toString()
            // });
            member.ws.send(data);
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

wss.on("connection", ws => {
    let id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.log("connected, id "+ id);
    members.push({id, ws});
    handle_connection(id, ws);
});

console.log("server started");