import React, { useEffect, useState } from "react";
import "./Game.css";
import Square from "../square/Square";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import tic from '../assets/tictac.gif';
import { useSocket } from "../SocketContext";

const renderFrom = [
    [1, 2, 3], [4, 5, 6], [7, 8, 9],
];

const Game = () => {
    const location = useLocation();
    const opponent = location.state?.opponent;
    const username = location.state?.username;
    const playingAs = location.state?.playingAs;
    const socket = useSocket();

    const [gameState, setGameState] = useState(renderFrom);
    const [currentPlayer, setCurrentPlayer] = useState("circle");
    const [finishState, setFinishState] = useState(false);
    const [winningState, setWinningState] = useState([]);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");

    const checkWinner = () => {
        for (let row = 0; row < gameState.length; row++) {
            if (gameState[row][0] === gameState[row][1] && 
                gameState[row][1] === gameState[row][2]) {
                setWinningState([row * 3 + 0, row * 3 + 1, row * 3 + 2]);
                return gameState[row][0];
            }
        }
        for (let col = 0; col < gameState.length; col++) {
            if (gameState[0][col] === gameState[1][col] && 
                gameState[1][col] === gameState[2][col]) {
                setWinningState([0 * 3 + col, 1 * 3 + col, 2 * 3 + col]);
                return gameState[0][col];
            }
        }
        if (gameState[0][0] === gameState[1][1] && 
            gameState[1][1] === gameState[2][2]) {
            setWinningState([0 * 3 + 0, 1 * 3 + 1, 2 * 3 + 2]);
            return gameState[0][0];
        }
        if (gameState[0][2] === gameState[1][1] && 
            gameState[1][1] === gameState[2][0]) {
            setWinningState([0 * 3 + 2, 1 * 3 + 1, 2 * 3 + 0]);
            return gameState[0][2];
        }
        const drawGame = gameState.flat().every((e) => e === "circle" || e === "cross");
        if (drawGame) return "draw";

        return null;
    };

    useEffect(() => {
        const winner = checkWinner();
        if (winner) {
            setFinishState(winner);
        }
    }, [gameState]);

    useEffect(() => {
        const handleServerMove = (data) => {
            const id = data.state.id;
            setGameState((prevState) => {
                let newState = [...prevState];
                const rowIndex = Math.floor(id / 3);
                const colIndex = id % 3;
                newState[rowIndex][colIndex] = data.state.sign;
                return newState;
            });
            setCurrentPlayer(data.state.sign === "circle" ? "cross" : "circle");
        };

        const handleOpponentLeft = () => {
            setFinishState("opponentLeft");
        };

        const handleChatMessage = (msg) => {
            setMessages((prevMessages) => [...prevMessages, msg]);
        };

        socket?.on("serverMove", handleServerMove);
        socket?.on("opponentLeft", handleOpponentLeft);
        socket?.on("chatMessage", handleChatMessage);

        return () => {
            socket?.off("serverMove", handleServerMove);
            socket?.off("opponentLeft", handleOpponentLeft);
            socket?.off("chatMessage", handleChatMessage);
        };
    }, [socket]);

    const opponentName = async () => {
        await Swal.fire({
            title: `You are playing with ${opponent}`,
            width: 600,
            padding: "3em",
            color: "black",
            background: `linear-gradient(135deg, #8915e8, #b86ef5)`,
            backdrop: `
                black
                url(${tic})
                left top
                no-repeat
            `
        });
    };

    useEffect(() => {
        if (opponent) {
            opponentName();
        }
    }, [opponent]);

    const handleMsgSend = () => {
        if (message.trim() === "") return;
        const msg = { user: username, text: message };
        socket.emit("chatMessage", msg);
        setMessages((prevMessages) => [...prevMessages, msg]);
        setMessage("");
    };

    return (
        <div className="game">
            <div className="main-div">
                <div className="detection">
                    <div className={`left ${
                        currentPlayer === playingAs ? "current-move-" + currentPlayer : ""
                    }`} >
                        {username}
                    </div>
                    <div className={`right ${
                        currentPlayer !== playingAs ? "current-move-" + currentPlayer : ""
                    }`} >
                        {opponent}
                    </div>
                </div>
                <div>
                    <h1 className="heading">Tic Tac Toe</h1>
                    <div className="sq-wrapper">
                        {gameState.map((arr, rowIndex) => 
                            arr.map((e, colIndex) => {
                                return <Square 
                                    socket={socket}
                                    playingAs={playingAs}
                                    gameState={gameState}
                                    winningState={winningState}
                                    finishState={finishState}
                                    currentPlayer={currentPlayer}
                                    setCurrentPlayer={setCurrentPlayer}
                                    setGameState={setGameState}
                                    id={rowIndex * 3 + colIndex}
                                    key={rowIndex * 3 + colIndex}
                                    currentElement={e}
                                />
                            })
                        )}
                    </div>
                    {finishState && 
                        finishState !== "opponentLeft" && 
                        finishState !== "draw" && (
                            <h3 className="finish">{finishState === playingAs ? "Yaayy!! You " : opponent} Won The Game</h3>
                    )}
                    {finishState && 
                        finishState !== "opponentLeft" &&
                        finishState === "draw" && (
                            <h3 className="finish">Opps!! It's a DRAW</h3>
                    )}
                    {finishState && finishState === "opponentLeft" && (
                        <h3 className="finish">Opponent has left!!</h3>
                    )}
                </div>
            </div>
            <div className="chat-container">
                <div className="messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.user === username ? "self" : ""}`}>
                            <span className="user">{msg.user}:</span> {msg.text}
                        </div>
                    ))}
                </div>
                <div className="chat-input">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                    />
                    <button onClick={handleMsgSend}>Send</button>
                </div>
            </div>
        </div>
    );
};

export default Game;
