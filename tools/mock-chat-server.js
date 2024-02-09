const WebSocket = require('ws');

function formatMessage({ type, ...rest }) {
  return `${type} ${JSON.stringify(rest)}`;
}

function parseMessage(message) {
  const messageRegex = /^(?<type>[A-Z]+) (?<rawData>.+)$/;
  const { type, rawData } = message.match(messageRegex).groups;
  const data = JSON.parse(rawData);
  data.type = type;
  return data;
}

const wss = new WebSocket.Server({ port: 8420 });

const sockets = {};
let id = 0;
wss.on('connection', function connection(ws) {
  const myId = id;
  sockets[myId] = ws;
  ws.on('message', function incoming(message) {
    const parsedMessage = parseMessage(message);
    parsedMessage.nick = parsedMessage.nick + myId;
    for (const socketId in sockets) {
      if (socketId != myId) {
        if (sockets[socketId].readyState === 1) {
          sockets[socketId].send(formatMessage(parsedMessage));
        }
      }
    }
  });
  ws.on('close', () => {
    delete sockets[id];
  });
  ws.on('error', (error) => {
    console.log(error);
  });
  id += 1;
});

wss.on('error', (error) => {
  console.log(error);
});
