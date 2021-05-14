const questionsCardCount = 19;
const answersCardCount = 20;
const cardsPerPlayer = 3;

var io;
var gameSocket;
var hostId;

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function (sio, socket) {
  io = sio;
  gameSocket = socket;
  gameSocket.emit("connected", { message: "You are connected!" });

  // Host Events
  gameSocket.on("hostJoinGame", hostJoinGame);
  gameSocket.on("hostStartGame", hostStartGame);

  // // Player Events
  gameSocket.on("playerJoinGame", playerJoinGame);
  gameSocket.on("playerPickCard", playerPickCard);
  gameSocket.on("submitPickedCard", submitPickedCard);
  gameSocket.on("submitBestCard", submitBestCard);
};

var shuffledQuestions = [];
var shuffledAnswers = [];

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Keep Host ID and shuffle cards.
function hostJoinGame() {
  hostId = gameSocket.id;
  shuffledQuestions = Array.from(Array(questionsCardCount).keys());
  shuffledAnswers = Array.from(Array(answersCardCount).keys());
  shuffleArray(shuffledQuestions);
  shuffleArray(shuffledAnswers);
  updatePlayersList();
}

var choosingPlayer;

var currentPlayers = [];

var playerNum;

function hostStartGame() {
  const clients = io.sockets.adapter.rooms.get("players");
  if (!clients) {
    return;
  }

  var playerArr = Array.from(clients);
  playerNum = Math.floor(Math.random() * playerArr.length);
  var playerId = playerArr[playerNum];

  choosingPlayer = io.sockets.sockets.get(playerId);

  var chosenUser = choosingPlayer.username;
  var questionCard = shuffledQuestions.shift();

  for (const clientId of clients) {
    const clientSocket = io.sockets.sockets.get(clientId);
    console.log(clientId);
    console.log(clientSocket.username);
    var pickedCards = [];
    for (var i = 0; i < cardsPerPlayer; i++) {
      pickedCards.push(shuffledAnswers.shift());
    }
    io.to(clientId).emit("playerSetupCards", {
      pickedCards,
      chosenUser,
      questionCard,
    });
    if (clientId === playerId) {
      io.to(clientId).emit("choosingPlayer");
    }
    currentPlayers.push({
      user: clientId,
      username: clientSocket.username,
      score: 0,
    });
  }
}

function playerJoinGame() {
  gameSocket.join("players");
  console.log("JOIN PLAYERS:", gameSocket.username);
  updatePlayersList();
}

function updatePlayersList() {
  const clients = io.sockets.adapter.rooms.get("players");
  if (!clients) {
    return;
  }
  console.log("\n-- Players --");
  var players = [];
  for (const clientId of clients) {
    //this is the socket of each client in the room.
    const clientSocket = io.sockets.sockets.get(clientId);

    //you can do whatever you need with this
    console.log(clientSocket.username);
    players.push(clientSocket.username);
  }
  console.log("-------------\n");
  io.emit("updatePlayersList", players);
}

function playerPickCard(index, username) {
  var pickedCard = shuffledAnswers.shift();
  const clients = io.sockets.adapter.rooms.get("players");

  var winnerId;

  for (const clientId of clients) {
    //this is the socket of each client in the room.
    const clientSocket = io.sockets.sockets.get(clientId);

    if (clientSocket.username == username) {
      io.to(clientId).emit("playerPickCard", [index, pickedCard]);
    }
  }
}

var submittedCards = [];

function submitPickedCard({ card, username, i }) {
  var user = {
    cardId: card,
    userId: username,
  };
  playerPickCard(i, username);
  console.log("submit picked");
  console.log(user.userId);
  submittedCards.push(user);
  const clients = io.sockets.adapter.rooms.get("players");
  var playerArr = Array.from(clients);
  if (submittedCards.length == playerArr.length - 1) {
    sendSubmissionsToMainPlayer();
  }
}

function sendSubmissionsToMainPlayer() {
  io.to(choosingPlayer.id).emit("submittedCards", submittedCards);
  submittedCards = [];
}

function submitBestCard(card) {
  const clients = io.sockets.adapter.rooms.get("players");

  var winnerId;

  for (const clientId of clients) {
    //this is the socket of each client in the room.
    const clientSocket = io.sockets.sockets.get(clientId);

    if (clientSocket.username == card.userId) {
      winnerId = clientSocket;
    }
  }
  console.log(card);
  var winner = winnerId.username;
  var winningCard = card.cardId;
  io.emit("roundWinner", { winner, winningCard });
  currentPlayers.forEach((player) => {
    if (player.username == card.userId) {
      player.score += 1;
    }
  });
  io.to(hostId).emit("updateScore", currentPlayers);
  setTimeout(() => {
    playerNum += 1;
    console.log(playerNum);
    console.log(currentPlayers.length);
    if (playerNum == currentPlayers.length) {
      playerNum = 0;
    }
    var nextCard = shuffledQuestions.shift();

    for (const clientId of clients) {
      const clientSocket = io.sockets.sockets.get(clientId);
      if (clientId === currentPlayers[playerNum].user) {
        choosingPlayer = io.sockets.sockets.get(clientId);
        io.to(clientId).emit("choosingPlayer");
      }
    }

    io.emit("nextRound", [currentPlayers[playerNum], nextCard]);
  }, 3000);
}
