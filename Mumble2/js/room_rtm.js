let handleMemberJoined = async (MemberId) => {
  // console.log('New member has joined the room: ', MemberId);
  addMemberToDom(MemberId);

  let members = await channel.getMembers();
  updateMemberTotal(members);
};

let addMemberToDom = async (MemberId) => {
  let { name } = await rtmClient.getUserAttributeByKeys(MemberId, ['name']);

  let membersWrapper = document.getElementById('member__list');
  let memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
    <span class="green__icon"></span>
    <p class="member_name">${MemberId}</p>
</div>`;

  membersWrapper.insertAdjacentHTML('beforeend', memberItem);
};

let updateMemberTotal = async (members) => {
  let total = document.getElementById('members__count');
  total.innerText = members.length;
};

let handleMemberLeft = async (MemberId) => {
  removeMemberFromDom(MemberId);
};

let removeMemberFromDom = async (MemberId) => {
  let memberWrapper = document.getElementById(`member__${MemberId}__wrapper`);
  memberWrapper.remove();
};

let getMembers = async () => {
  let members = await channel.getMembers();
  updateMemberTotal(members);
  for (let i = 0; i < members.length; i++) {
    addMemberToDom(members[i]);
  }
};

let addMessageToDOM = async (name, message) => {
  let messagesWrapper = document.getElementById('messages');
  let newMessage = `<div class="message__body">
    <strong class="message__author">${name}</strong>
    <p class="message__text">${message}</p>
</div>`;

  messagesWrapper.insertAdjacentHTML('beforeend', newMessage);
};

let leaveChannel = async () => {
  await channel.leave();
  await rtmClient.logout();
  let members = await channel.getMembers();
  updateMemberTotal(members);
};

let handleChannelMessage = async (messageData, MemberId) => {
  //   console.log('A new message was received ', MemberId);
  let data = JSON.parse(messageData.text);
  //   console.log('Message ', data);
  if (data.type === 'chat') {
    addMessageToDOM(data.displayName, data.message);
  }
};

let sendMessage = async (e) => {
  e.preventDefault();

  let message = e.target.message.value;
  channel.sendMessage({
    text: JSON.stringify({
      type: 'chat',
      message: message,
      displayName: displayName,
    }),
  });

  addMessageToDOM(displayName, message);
  // get last message to scroll
  let lastMessage = document.querySelector(
    '#messages .message__wrapper:last-child'
  );
  if (lastMessage) {
    lastMessage.scrollIntoView();
  }

  e.target.reset();
};

window.addEventListener('beforeunload', leaveChannel);
let messageForm = document.getElementById('message__form');
messageForm.addEventListener('submit', sendMessage);
