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

let rtmClient;
let channel;

// get room id from url param
// room.html?room=243
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room');

if (!roomId) {
  roomId = 'main';
}

let displayName = sessionStorage.getItem('display__name');
if (!displayName) {
  window.location = 'lobby.html';
}

// local tracks audio and video stream
let localTracks = [];
let remoteUsers = {}; // {'uid': []}

// to be able to share our screen
let localScreenTracks;
let sharingScreen = false;

let joinRoomInit = async () => {
  // connect to real time messaging agora
  rtmClient = await AgoraRTM.createInstance(APP_ID);
  await rtmClient.login({ uid, token });

  // pass an attribute when we connect to pass username
  await rtmClient.addOrUpdateLocalUserAttributes({ name: displayName });

  channel = await rtmClient.createChannel(roomId);
  await channel.join();

  channel.on('MemberJoined', handleMemberJoined);
  channel.on('MemberLeft', handleMemberLeft);
  channel.on('channelMessage', handleChannelMessage);

  // add member
  getMembers();

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

let switchToCamera = async (uid) => {
  let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                </div>`;
  displayFrame.insertAdjacentElement('beforeend', player);

  await localTracks[0].setMuted(true);
  await localTracks[1].setMuted(true);

  document.getElementById('mic-btn').classList.remove('active');
  document.getElementById('screen-btn').classList.remove('active');
  // play video stream
  localTracks[1].play(`user-${uid}`);
  await client.publish([localTracks[1]]); // tracks[0] audio, tracks[1] video
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
    let videoFrame = document.getElementById(`user-container-${user.uid}`);
    videoFrame.style.height = '100px';
    videoFrame.style.width = '100px';
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

let toggleCamera = async (event) => {
  let button = event.currentTarget();

  if (localTracks[1].muted) {
    // if camera is muted
    await localTracks[1].setMuted(false); // unmute camera
    button.classList.add('active');
  } else {
    await localTracks[1].setItem(true); // mute camera
    button.classList.remove('active');
  }
};

let toggleMic = async (event) => {
  let button = event.currentTarget();

  if (localTracks[0].muted) {
    // if mic is muted
    await localTracks[0].setMuted(false); // unmute mic
    button.classList.add('active');
  } else {
    await localTracks[0].setItem(true); // mute mic
    button.classList.remove('active');
  }
};

let toggleScreen = async (e) => {
  let screenButton = e.currentTarget;
  let cameraButton = document.getElementById('camera-btn');

  if (!sharingScreen) {
    sharingScreen = true;
    screenButton.classList.add('active');
    cameraButton.classList.remove('active');
    cameraButton.style.display = 'none';

    localScreenTracks = await AgoraRTC.createScreenVideoTrack();
    document.getElementById(`user-container-${uid}`).remove();
    displayFrame.style.display = 'block';
    let player = `<div class="video__container" id="user-container-${uid}">
            <div class="video-player" id="user-${uid}"></div>
        </div>`;

    displayFrame.insertAdjacentElement('beforeend', player);
    document
      .getElementById(`user-container-${uid}`)
      .addEventListener('click', expandVideoFrame);

    userIdInDisplayFrame = `user-container-${uid}`;
    localScreenTracks.play(`user-${uid}`);

    await client.unpublish([localTracks[1]]); // unpublish the video tracks
    await client.publish([localScreenTracks]); // publish our screen track

    let videoFrames = document.getElementsByClassName('video__container');
    for (let i = 0; i < videoFrames.length; i++) {
      videoFrames[i].style.height = '100px';
      videoFrames[i].style.width = '100px';
    }
  } else {
    sharingScreen = false;
    cameraButton.style.display = 'block';
    document.getElementById(`user-container-${user.uid}`).remove();
    await client.unpublish([localScreenTracks]);
    switchToCamera(uid);
  }
};

document.getElementById('camera-btn').addEventListener('click', toggleCamera);
document.getElementById('mic-btn').addEventListener('click', toggleCamera);
document.getElementById('screen-btn').addEventListener('click', toggleScreen);

joinRoomInit();
