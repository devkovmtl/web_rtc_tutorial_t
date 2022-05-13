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

let leaveChannel = async () => {
  await channel.leave();
  await rtmClient.logout();
  let members = await channel.getMembers();
  updateMemberTotal(members);
};

window.addEventListener('beforeunload', leaveChannel);
