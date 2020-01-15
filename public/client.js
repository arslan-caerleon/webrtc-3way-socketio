// getting dom elements
var divSelectRoom = document.getElementById("selectRoom");
var divConsultingRoom = document.getElementById("consultingRoom");
var divRooms = $("#rooms"); //document.getElementById("rooms");
var chatroom = $("#chatroom");
var divchatroom = document.getElementById("chatroom");
var divRoomsui = document.getElementById("rooms");
var inputRoomNumber = document.getElementById("roomNumber");
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");
var remoteVideo2 = document.getElementById("remoteVideo2");
var message = $("#message");
var messageui = document.getElementById("message");
var send_message = document.getElementById("send_message");
var inputzone = document.getElementById("input_zone");

// variables
var roomNumber;
var localStream;
var remoteStream;
var rtcPeerConnection;
var rtcPeerConnection2;
var iceServers = {
    'iceServers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' }
    ]
}
var streamConstraints = { audio: true, video: true };
var isCaller;

// Let's do this
var socket = io();

btnGoRoom.onclick = function () {
    if (inputRoomNumber.value === '') {
        alert("Please type a room number")
    } else {
        roomNumber = inputRoomNumber.value;
        createorjoinroom(roomNumber);
    }
};

send_message.onclick = function() {
    if (messageui.value === '') {
        //alert("Please type a message");
    } else {
        socket.emit('new_message', {message: message.val()});
        messageui.value = "";
    }     
};

messageui.addEventListener("keyup", function(event) {
  // Number 13 is the "Enter" key on the keyboard
  if (event.keyCode === 13) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    send_message.click();
  }
});

socket.on("new_message", (data) => {
    console.log(data);
    chatroom.append("<p class='message'>" + data.username + ": " + data.message + "</p>");

})

function createorjoinroom (room) {
    roomNumber = room;
    socket.emit('create or join', roomNumber);
    divSelectRoom.style = "display: none;";
    divRoomsui.style = "display: none;";
    divConsultingRoom.style = "display: block;";
    divchatroom.style = "display: block;height:200px;max-width:500px;overflow:auto";
    inputzone.style = "display: block;";
}        

socket.on('roomlist', function(roomList) {
    roomList.forEach(appendroom);
});

function appendroom (room) {
    divRooms.append("<div class='room'>Room " + room + "<button value='" + room + "' onclick=createorjoinroom('" + room + "')>Go</button></div>");
}

// message handlers
socket.on('created', function (room) {
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        isCaller = true;
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
});

socket.on('joined', function (room) {
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        localStream = stream;
        remoteVideo.srcObject = stream;
        socket.emit('ready', roomNumber);
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
});

socket.on('full', function (room) {
    console.log("Hi");
    alert("Room " + room + " is full.");
    divConsultingRoom.style = "display: none;";
    divchatroom.style = "display: none;";
    inputzone.style = "display: none;";
    divSelectRoom.style = "display: block;"; 
    divRoomsui.style = "display: block;";
});

socket.on('candidate', function (event) {
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });
    rtcPeerConnection.addIceCandidate(candidate);
});

socket.on('candidate2', function (event) {
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });
    if (rtcPeerConnection2) {
        rtcPeerConnection2.addIceCandidate(candidate);
    }
});

socket.on('ready', function () {
    if (isCaller && !rtcPeerConnection) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection.createOffer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    } else if (isCaller) {
        rtcPeerConnection2 = new RTCPeerConnection(iceServers);
        rtcPeerConnection2.onicecandidate = onIceCandidate;
        rtcPeerConnection2.ontrack = onAddStream2;
        rtcPeerConnection2.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection2.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection2.createOffer()
            .then(sessionDescription => {
                rtcPeerConnection2.setLocalDescription(sessionDescription);
                socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    } else if (!rtcPeerConnection2) {
        console.log("Yo it's me");
        rtcPeerConnection2 = new RTCPeerConnection(iceServers);
        rtcPeerConnection2.onicecandidate = onIceCandidate2;
        rtcPeerConnection2.ontrack = onAddStream2;
        rtcPeerConnection2.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection2.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection2.createOffer()
            .then(sessionDescription => {
                //await new Promise((resolve, reject) => setTimeout(resolve, 3000));
                rtcPeerConnection2.setLocalDescription(sessionDescription);
                socket.emit('offer2', {
                    type: 'offer2',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    }        
});

socket.on('offer', function (event) {
    console.log(!isCaller && !rtcPeerConnection);
    if (!isCaller && !rtcPeerConnection) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
        rtcPeerConnection.createAnswer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('answer', {
                    type: 'answer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});

socket.on('offer2', function (event) {
    console.log(!isCaller && !rtcPeerConnection);
    if (!isCaller && !rtcPeerConnection2) {
        rtcPeerConnection2 = new RTCPeerConnection(iceServers);
        rtcPeerConnection2.onicecandidate = onIceCandidate;
        rtcPeerConnection2.ontrack = onAddStream2;
        rtcPeerConnection2.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection2.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection2.setRemoteDescription(new RTCSessionDescription(event));
        rtcPeerConnection2.createAnswer()
            .then(sessionDescription => {
                rtcPeerConnection2.setLocalDescription(sessionDescription);
                socket.emit('answer2', {
                    type: 'answer2',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});

socket.on('answer', function (event) {
    if (isCaller && !rtcPeerConnection2) {
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
    } else if (isCaller) {
        rtcPeerConnection2.setRemoteDescription(new RTCSessionDescription(event));
    } 
});

socket.on('answer2', function (event) {
    if (!isCaller && !rtcPeerConnection2) {
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
    } else if (!isCaller) {
        console.log("Not the caller, setting remote2");
        rtcPeerConnection2.setRemoteDescription(new RTCSessionDescription(event));
    } 
});

// handler functions
function onIceCandidate(event) {
    if (event.candidate) {
        console.log('sending ice candidate');
        socket.emit('candidate', {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        })
    }
}

function onIceCandidate2(event) {
    if (event.candidate) {
        console.log('sending ice candidate');
        socket.emit('candidate2', {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        })
    }
}

function onAddStream(event) {
    if (isCaller) {
        remoteVideo.srcObject = event.streams[0];
    } else {
        localVideo.srcObject = event.streams[0];
    }
    remoteStream = event.stream;
}

function onAddStream2(event) {
    remoteVideo2.srcObject = event.streams[0];
    remoteStream = event.stream;
}