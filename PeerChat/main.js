let localStream; // local stream and microphone
let remoteStream; // remote stream and speakers

let init = async () => {
  // Get local Stream
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  // append the stream to video
  document.getElementById('user-1').srcObject = localStream;
};

init();
