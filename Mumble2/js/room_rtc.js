const APP_ID = '';

// check useridd
// each user need unique uid to know who is who
let uid = sessionStorage.getItem('uid');
if (uid) {
  uid = String(Math.floor(Math.random() * 100000));
  sessionStorage.setItem('uid', uid);
}

let token = null; // token for agora
let client; // core interface for rtm store user info

// get room id from url param
// room.html?room=243
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room');

if (!roomId) {
  roomId = 'main';
}

// local tracks audio and video stream
let localTracks = [];
let remoteUsers = {}; // {'uid': []}

let joinRoomInit = async () => {
  client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }); // create client object
  await client.join(APP_ID, roomId, token, uid); // join room

  client.on('user-published', handleUserPublished); // listen every time user published

  // need to listen when user leave
  client.on('user-left', handleUserLeft);

  //   await joinStream();
};

// get camera feed display to DOM
let joinStream = async () => {
  // first get audio and video tracks, //audio, video config
  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks(
    {},
    {
      encoderConfig: {
        width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 480, ideal: 1080, max: 1080 },
      },
    }
  );
  // create video player
  let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                </div>`;
  // add video player to DOM
  document
    .getElementById('streams__container')
    .insertAdjacentElement('beforeend', player);
  document
    .getElementById(`user-container-${uid}`)
    .addEventListener('click', expandVideoFrame);

  // play video stream
  localTracks[1].play(`user-${uid}`);

  // publish the tracks
  await client.publish([localTracks[0], localTracks[1]]); // tracks[0] audio, tracks[1] video
};

// publish our stream and add event whenever another user joins
let handleUserPublished = async (user, mediaType) => {
  remoteUsers[user.uid] = user;
  await client.subscribe(user, mediaType);
  let player = document.getElementById(`user-container-${user.uid}`);
  if (player === null) {
    player = `<div class="video__container" id="user-container-${user.uid}">
                    <div class="video-player" id="user-${user.uid}"></div>
                </div>`;

    // make sure this player does not exist in dom

    document
      .getElementById('streams__container')
      .insertAdjacentElement('beforeend', player);
    document
      .getElementById(`user-container-${user.uid}`)
      .addEventListener('click', expandVideoFrame);
  }

  if (displayFrame.style.display) {
    player.style.height = '100px';
    player.style.width = '100px';
  }

  if (mediaType === 'video') {
    user.videoTrack.play(`user-${user.uid}`);
  }

  if (mediaType === 'audio') {
    user.audioTrack.play(`user-${user.uid}`);
  }
};

// deal when user leave the room
let handleUserLeft = async (user) => {
  delete remoteUsers[user.uid];
  document.getElementById(`user-container-${user.uid}`).remove();
  if (userIdInDisplayFrame === `user-container-${user.uid}`) {
    displayFrame.style.display = 'none'; // remove the main frame if user that is in it leave
    let videoFrames = document.getElementsByClassName('video__container');
    for (let i = 0; i < videoFrames.length; i++) {
      videoFrames[i].style.height = '300px';
      videoFrames[i].style.width = '300px';
    }
  }
};

joinRoomInit();
