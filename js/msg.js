
let socket;
var freader = new FileReader();

let server_url;
server_url = "ws://localhost:8081/ws";
server_url = "ws://152.70.248.252:8081/ws";
const MSGIDS = [ "messages", "my_messages" ];

class info {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

function repNewMsg(id, msg) {
    let messages = document.getElementById(id);
    let newel = messages.appendChild(document.createElement("div"));
    newel.textContent = msg;
}

function handle_msg(event) {
    let data = JSON.parse(event.data);
    let id = data.id;
    let msg = data.msg;
    repNewMsg("messages", msg);
}
function handleKeyPress(e) {
    var key = e.keyCode || e.which;
    if (key == 13) {
        onClick_sendButton();
        return false;
    } else {
        return true;
    }
}

function connectWs(url) {
    socket = new WebSocket(url);
    socket.onopen = function (ev) {
        console.log("Connected to " + url);
        ev.send()
    };
    socket.onmessage = handle_msg;
    socket.onclose = function (ev) {
        console.log("Disconnected from " + url);
    };
    socket.onerror = function (error) {
        console.log("Error: " + error);
    };
    return socket;
}

function onClick_sendButton() {
    let messageInput = document.getElementById("messageInput");
    // console.log("me:"+messageInput.value);
    repNewMsg("my_messages", messageInput.value);
    socket.send(messageInput.value);
    messageInput.value = "";
}
function setup(){
    let sendButton = document.getElementById("sendButton");
    sendButton.addEventListener("click", onClick_sendButton);
    let messageInput = document.getElementById("messageInput");
    messageInput.addEventListener("keydown", handleKeyPress);
    connectWs(server_url);
}

window.onload = setup();
