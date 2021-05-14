const URL = "http://127.0.0.1:3000";
const socket = io(URL, { autoConnect: false });

socket.onAny((event, ...args) => {
  console.log(event, args);
});

var username;

function onUsernameSubmit() {
  // Join Server
  username = document.getElementById("username").value.toUpperCase();
  socket.auth = { username };
  socket.connect();

  if (username === "HOST") {
    socket.emit("hostJoinGame");
    document.getElementById("start-game-btn").style.display = "block";
  } else {
    socket.emit("playerJoinGame");
  }

  // Change Screen To Lobby
  document.getElementById("main-menu").classList.add("hidding");
  setTimeout(() => {
    document.getElementById("main-menu").classList.add("hidden");
    document.getElementById("main-menu").classList.remove("hidding");
    document.getElementById("lobby").classList.add("hidding");
    document.getElementById("lobby").classList.remove("hidden");
    document.getElementById("welcome-name").innerHTML =
      "Welcome " + username + "!";
    setTimeout(() => {
      document.getElementById("lobby").classList.remove("hidding");
    }, 100);
  }, 500);
  return false;
}

socket.on("updatePlayersList", (players) => {
  var list = document.getElementById("joined-users");
  list.innerHTML = "";
  players.forEach((player) => {
    var node = document.createElement("LI");
    var textnode = document.createTextNode(
      player === username ? player + " (YOU)" : player
    );
    node.appendChild(textnode);
    list.appendChild(node);
  });
});

function hostStartGame() {
  socket.emit("hostStartGame");
}

var cardsInHand = [];

socket.on("playerSetupCards", ({ pickedCards, chosenUser, questionCard }) => {
  var list = document.getElementById("card-list");
  cardsInHand = pickedCards;
  console.log(cardsInHand);
  var index = 0;
  pickedCards.forEach((card) => {
    var node = document.createElement("DIV");
    node.setAttribute("id", index);
    node.onclick = function () {
      document.getElementById("card-list").classList.add("hidden");
      document.getElementById("picked-container").classList.remove("hidden");
      document.getElementById("picked-card").innerHTML = answerCards[card];
      var i = node.getAttribute("id");
      socket.emit("submitPickedCard", { card, username, i });
    };
    var textnode = document.createTextNode(answerCards[card]);
    node.appendChild(textnode);
    list.appendChild(node);
    index++;
  });

  document.getElementById("choosing-player").innerHTML =
    chosenUser + "'s Question";
  document.getElementById("question-card").innerHTML =
    questionCards[questionCard];

  // Change Screen To Lobby
  document.getElementById("lobby").classList.add("hidding");
  setTimeout(() => {
    document.getElementById("lobby").classList.add("hidden");
    document.getElementById("lobby").classList.remove("hidding");
    document.getElementById("player-pick-card").classList.add("hidding");
    document.getElementById("player-pick-card").classList.remove("hidden");
    setTimeout(() => {
      document.getElementById("player-pick-card").classList.remove("hidding");
    }, 100);
  }, 500);
});

socket.on("choosingPlayer", () => {
  document.getElementById("card-list").classList.add("hidden");
});

socket.on("submittedCards", (cards) => {
  var list = document.getElementById("card-list");
  list.innerHTML = "";
  cards.forEach((card) => {
    var node = document.createElement("DIV");
    node.onclick = function () {
      document.getElementById("card-list").classList.add("hidden");
      document.getElementById("picked-container").classList.remove("hidden");
      document.getElementById("picked-card").innerHTML =
        answerCards[card.cardId];
      socket.emit("submitBestCard", card);
    };
    var textnode = document.createTextNode(answerCards[card.cardId]);
    node.appendChild(textnode);
    list.appendChild(node);
  });
  document.getElementById("card-list").classList.remove("hidden");
});

socket.on("roundWinner", ({ winner, winningCard }) => {
  document.getElementById("picked-title").innerHTML = winner + " won!";
  document.getElementById("picked-card").innerHTML = answerCards[winningCard];
});

socket.on("nextRound", (data) => {
  document.getElementById("choosing-player").innerHTML =
    data[0].username + "'s Question!";
  document.getElementById("question-card").innerHTML = questionCards[data[1]];

  if (username == data[0].username) {
    document.getElementById("card-list").classList.add("hidden");
    document.getElementById("picked-container").classList.add("hidden");
  } else {
    document.getElementById("card-list").classList.remove("hidden");
    document.getElementById("picked-container").classList.add("hidden");
  }

  var list = document.getElementById("card-list");
  list.innerHTML = "";

  var index = 0;

  cardsInHand.forEach((card) => {
    var node = document.createElement("DIV");
    node.setAttribute("id", index);
    node.onclick = function () {
      document.getElementById("card-list").innerHTML = "";
      document.getElementById("picked-container").classList.remove("hidden");
      document.getElementById("picked-card").innerHTML = answerCards[card];
      document.getElementById("picked-title").innerHTML = "You picked :";
      var i = node.getAttribute("id");
      socket.emit("submitPickedCard", { card, username, i });
    };
    var textnode = document.createTextNode(answerCards[card]);
    node.appendChild(textnode);
    list.appendChild(node);
    index++;
  });
});

socket.on("playerPickCard", (data) => {
  cardsInHand[data[0]] = data[1];
  console.log(cardsInHand);
});

socket.on("updateScore", (players) => {
  var list = document.getElementById("joined-users");
  list.innerHTML = "";
  players.forEach((player) => {
    var node = document.createElement("LI");
    var textnode = document.createTextNode(
      player.username + " - " + player.score
    );
    node.appendChild(textnode);
    list.appendChild(node);
  });
});
