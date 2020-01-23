// This is not a real datastore, but it can be if you make it one :)

const messages = {};
const users: {
  [id: string]: {
    user: string;
    channel: string;
  };
} = {};
let me: string = undefined;
let defaultChannel: {
  name: string;
  id: string;
} = undefined;

function getMessages() {
  return messages;
}

function addUser(user: { user: string; channel: string }) {
  users[user.user] = user;
}

function getUser(id: string) {
  return users[id];
}

function setChannel(channel: { name: string; id: string }) {
  defaultChannel = channel;
}

function getChannel() {
  return defaultChannel;
}

function setMe(id: string) {
  me = id;
}

function getMe() {
  return me;
}

export { getMessages, addUser, getUser, setChannel, getChannel, setMe, getMe };
