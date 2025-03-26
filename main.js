const startChatButton = document.querySelector('.start-videochat-button');
const messageInput = document.querySelector('.message-input');
const sendButton = document.querySelector('.send-button');
const messageWindow = document.querySelector('.message-window');

let localStream;
let remoteStream;
let peerConnection;

const socket = io(); 

function setupWebRTC() {
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      localStream = stream;
      document.querySelector('#localVideo').srcObject = localStream;

      socket.emit('ready', { userId: socket.id });
    })
    .catch(error => console.log('Error accessing media devices.', error));
}

function connectToPeer(remoteUserId) {
  const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('candidate', event.candidate);
    }
  };

  peerConnection.ontrack = event => {
    remoteStream = event.streams[0];
    document.querySelector('#remoteVideo').srcObject = remoteStream;
  };

  peerConnection.createOffer()
    .then(offer => {
      return peerConnection.setLocalDescription(offer);
    })
    .then(() => {
      socket.emit('offer', { to: remoteUserId, offer: peerConnection.localDescription });
    })
    .catch(error => console.error('Error creating offer', error));
}

sendButton.addEventListener('click', () => {
