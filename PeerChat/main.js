let APP_ID = '';
let token = null;
let uid = String(Math.floor(Math.random() * 100000)); // uid for user

let client;
let channel;

let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
// from params
let roomId = urlParams.get('room');
if (!roomId) {
  window.location = 'lobby.html';
}

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
  channel = client.createChannel(roomId);
  await channel.join();

  channel.on('MemberJoined', handleUserJoined);
  channel.on('MemberLeft', handleUserLeft);

  client.on('MessageFromPeer', handleMessageFromPeer);

  // Get local Stream
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  // append the stream to video
  document.getElementById('user-1').srcObject = localStream;
};

let handleUserLeft = (MemberId) => {
  document.getElementById('user-2').style.display = 'none';
};

let handleMessageFromPeer = async (message, MemberId) => {
  // console.log('Message: ', message);
  message = JSON.parse(message);
  if (message.type === 'offer') {
    // create an answer
    await createAnswer(MemberId, message.offer);
  }
  if (message.type === 'answer') {
    addAnswer(MemberId, message.answer);
  }

  if (message.type === 'candidate') {
    if (peerConnection) {
      peerConnection.addIceCandidate(message.candidate);
    }
  }
};

// user joined
let handleUserJoined = async (MemberId) => {
  console.log('A new user joined the channel: ', MemberId);

  createOffer(MemberId);
};

let createPeerConnection = async (MemberId) => {
  // interface that store all informations between us and remote peer
  peerConnection = new RTCPeerConnection(servers);
  remoteStream = new MediaStream();
  document.getElementById('user-2').srcObject = remoteStream;
  document.getElementById('user-2').style.display = 'block';
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
};

let createOffer = async (MemberId) => {
  //   // interface that store all informations between us and remote peer
  //   peerConnection = new RTCPeerConnection(servers);
  //   remoteStream = new MediaStream();
  //   document.getElementById('user-1').srcObject = remoteStream;
  //   if (!localStream) {
  //     // Get local Stream
  //     localStream = await navigator.mediaDevices.getUserMedia({
  //       audio: true,
  //       video: true,
  //     });
  //     // append the stream to video
  //     document.getElementById('user-1').srcObject = localStream;
  //   }

  //   // take local stream add to peer connection
  //   localStream.getTracks().forEach((track) => {
  //     peerConnection.addTrack(track, localStream);
  //   });

  //   // listen for when our peer has track too
  //   peerConnection.ontrack = (event) => {
  //     event.streams[0].getTracks().forEach((track) => {
  //       remoteStream.addTrack(track);
  //     });
  //   };

  //   // listen of when ice candidate is generated
  //   peerConnection.onicecandidate = async (event) => {
  //     if (event.candidate) {
  //       //   console.log('New ICE candidate ', event.candidate);
  //       client.sendMessageToPeer(
  //         {
  //           text: JSON.stringify({
  //             type: 'candidate',
  //             candidate: event.candidate,
  //           }),
  //         },
  //         MemberId
  //       );
  //     }
  //   };

  await createPeerConnection(MemberId);

  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  //   console.log('Offer: ', offer);
  // send offer once created
  client.sendMessageToPeer(
    { text: JSON.stringify({ type: 'offer', offer: offer }) },
    MemberId
  );
};

let createAnswer = async (MemberId, offer) => {
  await createPeerConnection(MemberId);

  await peerConnection.setRemoteDescription(offer);

  let answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  client.sendMessageToPeer(
    { text: JSON.stringify({ type: 'answer', answer: answer }) },
    MemberId
  );
};

let addAnswer = async (answer) => {
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(answer);
  }
};

let leaveChannel = async () => {
  await channel.leave();
  await client.logout();
};

let toggleCamera = async () => {
  let videoTrack = localStream
    .getTracks()
    .find((track) => track.kind === 'video');

  if (videoTrack.enabled) {
    videoTrack.enabled = false;
    document.getElementById('camera-btn').style.backgroundColor =
      'rgb(255,80,80)';
  } else {
    videoTrack.enabled = true;
    document.getElementById('camera-btn').style.backgroundColor =
      'rgba(179, 102,249,.9)';
  }
};

let toggleMic = async () => {
  let audioTrack = localStream
    .getTracks()
    .find((track) => track.kind === 'audio');

  if (audioTrack.enabled) {
    audioTrack.enabled = false;
    document.getElementById('mic-btn').style.backgroundColor = 'rgb(255,80,80)';
  } else {
    audioTrack.enabled = true;
    document.getElementById('mic-btn').style.backgroundColor =
      'rgba(179, 102,249,.9)';
  }
};

window.addEventListener('beforeunload', leaveChannel);

init();
