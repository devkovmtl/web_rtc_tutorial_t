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
  // first get audio and video tracks
  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
  // create video player
  let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                </div>`;
  // add video player to DOM
  document
    .getElementById('streams__container')
    .insertAdjacentElement('beforeend', player);

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
};

joinRoomInit();
