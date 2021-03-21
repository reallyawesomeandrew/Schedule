const cards = document.querySelectorAll(".card");
const userList = document.getElementById("users");
const start = document.getElementById("start");
const startError = document.querySelector(".error");
const userCardsList = document.querySelector(".user-cards");
const error = document.querySelector(".error");
const whoseTurn = document.getElementById("whose-turn");
const board = document.querySelector(".board");
const modal = document.querySelector(".modal");
const chatModal = document.getElementById("chat").parentElement;
const closeChat = document.querySelector(".close-modal");
const chatButton = document.getElementById("chat-start");
const chatSubmit = document.getElementById("chat-submit");
const chatForm = document.getElementById("chat-form");
const messages = document.querySelector(".messages");
const chatNotify = document.querySelector(".chat-notify");
const resultModal = document.getElementById("result-modal");
const results = document.getElementById("results");

resultModal.style.width = `${board.offsetWidth}px`;
window.addEventListener("resize", (e) => {
    resultModal.style.width = `${board.offsetWidth}px`;
} )
var chatShown = false;
var score = 0;
var alreadyChosen = false;
cards.forEach(card => {
    card.style.backgroundImage = `url('./Playing_Cards/${card.id}.png')`;
    card.style.backgroundSize = "75px 114px"
})

function outputUsers(users){
    userList.innerHTML = `${users.map(user => `<li class='user'><span class='user-name'>${user.username}</span> <span class='flip-num'>0</span></li>`).join("")}`
}
function cardProcess(e){
    card = e.target.id;
    socket.emit("goChangeBoard",card);
    window.myCards.splice(window.myCards.findIndex((cardy) => {
        return cardy == card;
    }), 1);
    document.getElementById(card).parentElement.removeChild(document.getElementById(card))
    window.myCards.forEach(card => {
        document.getElementById(card).style.opacity = "1";
    })
    e.target.removeEventListener("click", cardProcess)
}
function flipCardProcess(e){
    card = e.target.id;
    window.myCards.splice(window.myCards.findIndex((cardy) => {
        return cardy == card;
    }), 1);
    e.target.style.display = "none";
    var flipCard = document.createElement("div");
    flipCard.classList.add("card");
    flipCard.classList.add("flip-card")
    flipCard.id = card;
    flipCard.style.backgroundImage = "url('./Playing_Cards/gray_back.png')";
    flipCard.style.backgroundSize = "75px 114px"
    document.querySelector(".flipped").appendChild(flipCard);
    socket.emit("flip", username);
    window.myCards.forEach(card => {
        document.getElementById(card).removeEventListener("click", flipCardProcess, { once: true})
    })

}
const socket = io();
const { username }  = Qs.parse(location.search,{
    ignoreQueryPrefix: true
})
socket.emit("joinRoom", username);
socket.on("invalidUser", () => {
   modal.style.display = "block";
})
socket.on("roomUsers", ({ users })  => {
    outputUsers(users);
});
socket.on("onePlayer", (e) => {
    startError.style.display = "block";
    startError.addEventListener("click", (e) => {
        startError.style.display = "none";
    })
})

start.addEventListener("click", (e) =>  {
    socket.emit("start")
})
chatButton.addEventListener("click", (e) => {
    chatModal.style.display = "block";
    chatShown = true;
})
closeChat.addEventListener("click", (e) => {
    chatModal.style.display = "none";
    chatShown = false;
    chatNotify.innerHTML = "0";
    chatNotify.style.display = "none";
})
chatForm.addEventListener("submit", (e) =>{
    e.preventDefault();

    const msg = e.target.elements.msg.value;

    socket.emit("chatMessage", {user: username, msg: msg});

    e.target.elements.msg.value = "";
    e.target.elements.msg.focus();
})

// socket.on("error", err => {
//     error.style.display = "block";
//     error.textContent = err;
//     setTimeout(() => 
//     {error.style.display = "none"},
//     10000)
// })
socket.on("yourCards", cards => {
    start.style.display = "none";
    window.myCards = cards;
    var S = [];
    var H = [];
    var D = [];
    var C = [];

    cards.forEach(card => {
        if(card.slice(1,card.length) == "S"){
            S.push(card);
        }else if(card.slice(1,card.length) == "H"){
            H.push(card);
        }else if(card.slice(1,card.length) == "D"){
            D.push(card);
        }else{
            C.push(card);
        }
    })
    var sortedList = S.concat(H.concat(D.concat(C)));
    sortedList.forEach(card => {
        var cardElement = document.createElement("div");
        cardElement.id = card;
        cardElement.setAttribute("draggable", "true")
        cardElement.classList.add("card");
        cardElement.style.backgroundImage = `url('./Playing_Cards/${card}.png')`
        cardElement.style.backgroundSize = "75px 114px";
        userCardsList.appendChild(cardElement)
    })
    

})
socket.on("userLeave", () => {
    console.log("You have disconnected")
})
socket.on("whoseTurn", ({ user,available })  => {
    socket.on("roomUsers", ({ users })  => {
        outputUsers(users);
    })
    if(user.username == username){
        if(window.myCards.length == 0){
            socket.emit("gameEnd")
        }
        whoseTurn.innerHTML = "<h4>Your Turn</h4>";
        alreadyChosen = false;
        var hasCard = false;
        window.myCards.forEach(card => {
            if(available.includes(card) == false){
                document.getElementById(card).style.opacity = "0.5";
            }else{
                hasCard = true
                document.getElementById(card).style.display = "inline-block";
                document.getElementById(card).addEventListener("dragend", cardProcess)
            }
            
    
        })
        if (hasCard == false) {
            window.myCards.forEach(card => {
                document.getElementById(card).style.display = "inline-block";
                document.getElementById(card).addEventListener("click", flipCardProcess, { once: true})
            })

    }
    }else{
        whoseTurn.innerHTML = `<h4>${user.username}'s Turn</h4>`
    }

})
socket.on("reallyChangeBoard", card => {
    document.getElementById(`${card}-spot`).style.backgroundImage = `url('./Playing_Cards/${card}.png')`;
    document.getElementById(`${card}-spot`).style.backgroundSize = "75px 114px";
    document.getElementById(`${card}-spot`).style.display = "block";
    var cardSpots = document.querySelectorAll(".card-spot");
    cardSpots.forEach(spot => {
        if(spot.id[0] == card[0]){
            spot.style.display = "block";
        }
    })
})
socket.on("realFlipCard", (user) => {
    var userElementList = document.querySelectorAll(".user");
    userElementList.forEach(userElement => {
        var flipNum = userElement.querySelector(".flip-num");
        var userName = userElement.querySelector(".user-name");
        if(userName.innerHTML == user){
            newNum = parseInt(userElement.querySelector(".flip-num").innerHTML, 10) + 1;
            flipNum.innerHTML = newNum.toString();
        }
    })
})
socket.on("getFlipped", () => {
   window.myCards = [];
   resultModal.style.display = "block";
   var flipped = document.querySelectorAll(".flip-card");
   var output = [];
   flipped.forEach(card => output.push(card.id));
   socket.emit("flippedCards", { username: username, flipped: output})
})
socket.on("playerResult", ({username, flipped, score}) => {
    var tr = document.createElement("tr");
    tr.innerHTML = `<td><h3>${username}:</h3></td>
    <td class="flipped-cards-result">

    </td>

    <td class="points"><h3>${score}</h3></td>`;
    if(flipped.length == 0){
        tr.querySelector(".flipped-cards-result").appendChild(document.createTextNode("No Cards Flipped"))
    }
    flipped.forEach(card => {
        var td = document.createElement("td");
        td.innerHTML = `<td><div class="small-card"></div></td>`;
        td.querySelector(".small-card").style.backgroundImage = `url(../Playing_Cards/${card}.png)`;
        td.querySelector(".small-card").style.backgroundSize = "37.5px 57px";
        tr.querySelector(".flipped-cards-result").appendChild(td);
    })

    results.appendChild(tr)

    
})

socket.on("realChatMessage", ({user, msg, time}) => {
    var message = document.createElement("div");
    message.classList.add("message");
    message.innerHTML = `
    <p class="meta">${user} <span>${time}</span></p>
    <p class="text">${msg}</p>`
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
    if (chatShown == false) {
        chatNotify.innerHTML = `${parseInt(chatNotify.innerHTML, 10) + 1}`
        chatNotify.style.display = "inline";
    }
});

socket.on("end", () => {
    window.myCards = [];
    userCardsList.innerHTML = "";
    start.style.display = "block";
    whoseTurn.innerHTML = "<h3>Game has not started yet</h3>"
    document.querySelectorAll(".card-spot").forEach(card => card.style.display = "none");
    document.querySelectorAll(".seven").forEach(seven => seven.style.display = "none");
})