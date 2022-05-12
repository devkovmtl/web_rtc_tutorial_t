let APP_ID = '';
let token = null;
let uid = String(Math.floor(Math.random() * 100000)); // uid for user

let client;
let channel;

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
  client = await AgoraRTM.createInstance(APP_ID);
  await client.login({ uid, token });
  // roomID comes from the url ?room=
  channel = client.createChannel('main');
  await channel.join();

  channel.on('MemberJoined', handleUserJoined);

  client.on('MessageFromPeer', handleMessageFromPeer);

  // Get local Stream
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  // append the stream to video
  document.getElementById('user-1').srcObject = localStream;
};

let handleMessageFromPeer = async (message, MemberId) => {
  // console.log('Message: ', message);
  message = JSON.parse(message);
};

// user joined
let handleUserJoined = async (MemberId) => {
  console.log('A new user joined the channel: ', MemberId);

  createOffer(MemberId);
};

let createOffer = async (MemberId) => {
  // interface that store all informations between us and remote peer
  peerConnection = new RTCPeerConnection(servers);
  remoteStream = new MediaStream();
  document.getElementById('user-1').srcObject = remoteStream;
  if (!localStream) {
    // Get local Stream
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    // append the stream to video
    document.getElementById('user-1').srcObject = localStream;
  }

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
      //   console.log('New ICE candidate ', event.candidate);
      client.sendMessageToPeer(
        {
          text: JSON.stringify({
            type: 'candidate',
            candidate: event.candidate,
          }),
        },
        MemberId
      );
    }
  };

  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  //   console.log('Offer: ', offer);
  // send offer once created
  client.sendMessageToPeer(
    { text: JSON.stringify({ type: 'offer', offer: offer }) },
    MemberId
  );
};

init();
