
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const moment = require("moment");
const app = express();
const server = http.createServer(app);
const io = socketio(server);


// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

var users = [];
var userNum = 0;
var currentBoard = [];
var currentAvailable = ["7S"]
var started = false;
var lostUser = null;
const suitValues = {
    "J": 11,
    "Q": 12,
    "K": 13,
    "A": 1
}
const reverseSuitValues = {
    11: "J",
    12: "Q",
    13: "K",
    1: "A"
}
function userJoin(id, username) {
    const user = { id, username };
    if(users.length == 0){
        users.push(user);
        return users 
    }else{
        var ouput = users;
        users.forEach(oldUsers => {
            if(oldUsers.username == user.username){
                ouput = ["INVALID_USER", user]
            }
        })
        if(ouput == users){
            users.push(user);
            return users
        }else{
            return ouput
        }
    }


}
function userLeave(id){
    const index = users.findIndex(user => user.id === id);
    if(index !== -1){
        users.splice(index, 1);
        return users
    }else{
        return users
    }
}
function findAvailable(board){
    var output = [];
    var suitsCheck = [["S"], ["H"], ["D"], ["C"]]
    board.forEach(suit => {
        suitsCheck.forEach(suitList => {;
            // console.log(suitList[0])
            if(suitList[0] == suit.charAt(suit.length - 1)){
                suitList.push(suit)
            }
        })
    })
    console.log(suitsCheck)
    suitsCheck.forEach(suitList => {
        if(suitList.length == 1){
            output.push("7" + suitList[0])
        }else{
            var smallest = 7;
            var biggest = 7;
            suitList.forEach(card => {
                if(card.length > 1){
                    console.log("card: " + card);
                    var firstValue = card.slice(0, -1);
                    console.log("first Value: " + firstValue);
                    var value = isNaN(parseInt(firstValue, 10)) ? suitValues[firstValue]: parseInt(firstValue, 10);
                    console.log("value: " + value)
                    if(value < smallest){
                        smallest = value;
                    }
                    if(value > biggest){
                        biggest = value;
                    }
                }

            })
            if(smallest != 1){
                console.log("smallest: " + smallest);
                var avaCard = smallest - 1 == 1 ? "A":  (smallest-1).toString(10);
                console.log("new card: " + avaCard )
                output.push(avaCard + suitList[0])
            }
            if(biggest != 13){
                console.log("biggest: " + biggest);
                var avaCard = biggest + 1 > 10 ? reverseSuitValues[biggest+1]: (biggest + 1).toString(10);
                console.log("new card: " + avaCard)
                output.push(avaCard + suitList[0])
            }
        }
        suitList.shift();
    }
    )
    return output

}
function formatList(List){
    var output = [];
    List.forEach(smallList => {
        smallList.forEach(element => {
            output.push(element);
        })
    })
    return output
}
function remove(List, item){
    List.splice(List.findIndex((i) => {
        return  i == item
    }), 1);
    return List
}
// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', (username) => {
        var userJoinStuff = userJoin(socket.id, username);
        if (userJoinStuff[0] == "INVALID_USER") {
            socket.join(userJoinStuff[1])
            io.to(userJoinStuff[1]).emit("invalidUser");
            socket.leave(userJoinStuff[1])
        }
            io.emit('roomUsers', {
                users: users
            });

     // Runs when client disconnects 
    socket.on('disconnect', () => {
        var users = userLeave(socket.id);
        io.emit('roomUsers', {
            users: users
        });
        if(started == true){
            started = false;
            users = [];
            userNum = 0;
            currentBoard = [];
            currentAvailable = ["7S"]
            io.emit("end")
        }
        
    });
    socket.on("start", () => {
        if(users.length == 1){
            socket.emit("onePlayer");
        }else{
            started = true;
        var cards = ["AS", "2S", "3S", "4S", "5S", "6S", "7S", "8S", "9S", "10S", "JS", "QS", "KS",
        "AH", "2H", "3H", "4H", "5H", "6H", "7H", "8H", "9H", "10H", "JH", "QH", "KH",
        "AD", "2D", "3D", "4D", "5D", "6D", "7D", "8D", "9D", "10D", "JD", "QD", "KD",
        "AC", "2C", "3C", "4C", "5C", "6C", "7C", "8C", "9C", "10C", "JC", "QC", "KC"]
        var userLength = cards.length/users.length;
        var newUsers = [];
        var firstPlayer = null;
        users.forEach(user => {
            var userCards = []
            for(i=0; i < userLength; i++){
                var randomNumber = Math.ceil(Math.random() * (cards.length - 1));

                var chosen = cards[randomNumber];
                cards = remove(cards, chosen);
                userCards.push(chosen);
            }
            if(userCards.includes("7S")){
                firstPlayer = user;
                newUsers.push(user);
            }
            socket.join(user);
            io.to(user.id).emit("yourCards", userCards)
            socket.leave(user);

        })
        users.forEach(user => {
            if(user != firstPlayer){
                newUsers.push(user);
            }
        })
        users = newUsers;
        currentUser = users[0];
        io.emit("whoseTurn", {user: currentUser, available: currentAvailable} );
    }})

        
    socket.on("goChangeBoard", (card)=> {
        io.emit("reallyChangeBoard", card);
        userNum ++;
        currentUser = users[userNum % users.length];
        currentBoard.push(card);
        console.log(currentBoard)
        var available = findAvailable(currentBoard);
        console.log(available);
        io.emit("whoseTurn", {user: currentUser, available: available});
    })
    socket.on("flip", (username) => {
        io.emit("realFlipCard", username);
        userNum ++;
        currentUser = users[userNum % users.length];
        var available = findAvailable(currentBoard);
        io.emit("whoseTurn", {user: currentUser, available: available});
    })
    socket.on("gameEnd", () => {
        console.log("game end");
        io.emit("getFlipped")
    })
    socket.on("flippedCards", ({username, flipped}) => {
        var score = 0;
        if(flipped.length != 0){
            flipped.forEach(card => {
                var firstValue = card.slice(0, -1);
                score += isNaN(parseInt(firstValue, 10)) ? suitValues[firstValue]: parseInt(firstValue, 10)
            });
        }

        io.emit("playerResult", ({username: username, flipped: flipped, score: score}));
        
    })
    socket.on("chatMessage", ({ user, msg}) => {
        io.emit("realChatMessage", { user: user, msg: msg, time: moment().format("h:mm a")})
    })


})});



const PORT = process.env.PORT || 2000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
