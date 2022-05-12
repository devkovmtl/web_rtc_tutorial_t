let localStream; // local stream and microphone
let remoteStream; // remote stream and speakers
let peerConnection;

// free stun server
const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
};

let init = async () => {
  // Get local Stream
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  // append the stream to video
  document.getElementById('user-1').srcObject = localStream;
};

let createOffer = async () => {
  // interface that store all informations between us and remote peer
  peerConnection = new RTCPeerConnection(servers);
  remoteStream = new MediaStream();
  document.getElementById('user-1').srcObject = remoteStream;

  // take local stream add to peer connection
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // listen for when our peer has track too
  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  // listen of when ice candidate is generated
  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      console.log('New ICE candidate ', event.candidate);
    }
  };

  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  console.log('Offer: ', offer);
};

init();
