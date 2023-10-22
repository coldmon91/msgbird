// const { json } = require("stream/consumers");
let signaling_serv = "ws://localhost:8081/ws";
signaling_serv = "ws://172.30.1.15:8081/ws";
let signaling_chan; 
let rtclog = document.getElementById("rtclog");

// const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};
const configuration = {
    iceServers: [{urls: ['stun:stunserver.stunprotocol.org:3478']}],
};
let peerConnection = new RTCPeerConnection(configuration);

async function playVideoFromCamera() {
    try {
        const constraints = {'video': true, 'audio': true};
        let stream = await navigator.mediaDevices.getUserMedia(constraints);
        let videoElement = document.getElementById('localVideo');
        videoElement.srcObject = stream;
        stream.getTracks().forEach(track => 
                peerConnection.addTrack(track, stream)
            );
    } catch(error) {
        console.error('Error opening video camera.', error);
    }
}

async function makeCall() {
    console.log("Starting call");
    const offer = await peerConnection.createOffer();
    console.log("setLocalDescription");
    await peerConnection.setLocalDescription(offer);
    console.log("Sending offer");
    let o = {'offer': offer};
    signaling_chan.send(JSON.stringify(o));
}

function setupPeerConnection() {
    peerConnection.onicecandidate = function (event) {
        console.log("ice candidate");
        if (event.candidate) {
            console.log("Sending ice candidate");
            let o = {'ice-candidate': event.candidate};
            signaling_chan.send(JSON.stringify(o));
        }
    };
    peerConnection.onicecandidateerror = function (event) {
        console.log("ice candidate error");
    };
    peerConnection.onsignalingstatechange = function (event) {
        switch (peerConnection.signalingState) {
            case "stable":
                console.log("signaling state 'stable'");
                playVideoFromCamera();
                break;
        }
    };
    peerConnection.addEventListener('icecandidate', event => {
        console.log('Got local candidate: ', event.candidate);
        if (event.candidate) {
            console.log("Sending new ice candidate");
            let o = {'new-ice-candidate': event.candidate};
            signaling_chan.send(JSON.stringify(o));
        }
    });
    peerConnection.addEventListener('iceconnectionstatechange', event => {
        if (peerConnection.connectionState === 'connected') {
            console.log("ice connected");
        } else {
            console.log("ice "+peerConnection.connectionState.toString());
        }
    });
    peerConnection.addEventListener('icegatheringstatechange', event => {
        console.log("ice gathering change "+ peerConnection.iceGatheringState.toString());
    });
    peerConnection.addEventListener('track', async (event) => {
        const [remoteStreams] = event.streams;
        let videoElement = document.getElementById('remoteVideo');
        videoElement.srcObject = remoteStreams;
    });
}

function start_rtc() {
    setupPeerConnection();
    signaling_chan = new WebSocket(signaling_serv);
    signaling_chan.onopen = function() {
        console.log("Connected to signaling channel");
    };
    signaling_chan.onclose = function() {
        console.log("Disconnected from signaling channel");
    };
    signaling_chan.onmessage = async message => {
        let data = await message.data.text();
        if (typeof data !== 'string') {
            return;
        }
        data = JSON.parse(data);
        if (data.offer) {
            console.log("Got offer");
            const remoteDesc = new RTCSessionDescription(data.offer);
            await peerConnection.setRemoteDescription(remoteDesc);
            await peerConnection.setLocalDescription(await peerConnection.createAnswer());

            const answer = peerConnection.localDescription;
            console.log("Sending answer");
            signaling_chan.send(JSON.stringify({'answer': answer}));

        } else if (data.answer) {
            console.log("Got answer");
            const remoteDesc = new RTCSessionDescription(data.answer);
            await peerConnection.setRemoteDescription(remoteDesc);
        } else if (data.iceCandidate) {
            console.log("Got ice candidate");
            try {
                await peerConnection.addIceCandidate(message.iceCandidate);
            } catch (e) {
                console.error('Error adding received ice candidate', e);
            }
        } else {
            console.log("Got unknown message");
        }
    };
}