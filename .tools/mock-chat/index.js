const WebSocket = require('ws');

function formatMessage(nick, message) {
  return `MSG ${JSON.stringify({ nick, message })}`;
}

function parseMessage(message) {
  return JSON.parse(message.replace('MSG ', ''));
}

const wss = new WebSocket.Server({port: 8420});

const sockets = {};
let id = 0;
wss.on('connection', function connection(ws) {
  const myId = id;
  sockets[myId] = ws;
  ws.on('message', function incoming(message) {
    let parsedMessage = parseMessage(message);
    parsedMessage.nick = parsedMessage.nick + myId;
    for(let socketId in sockets){
      if(socketId != myId){
        if(sockets[socketId].readyState === 1){
          sockets[socketId].send(formatMessage(parsedMessage.nick, parsedMessage.message));
        }
      }
    }
  });
  ws.on('close', ()=> {
    delete sockets[id]
  });
  ws.on('error', (error)=> {
    console.log(error);
  });
  id += 1
});

wss.on('error', (error)=>{
  console.log(error);
});
