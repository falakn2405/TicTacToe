import React, { useState, useEffect } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useSocket } from "../SocketContext";

const Home = () => {
    const socket = useSocket();
    const [username, setUsername] = useState('');
    const [opponent, setOpponent] = useState('');
    const [playingAs, setPlayingAs] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (username && socket && opponent) {
            navigate('/game', { state: { opponent, username, playingAs } });
        }
    }, [username, socket, opponent, playingAs, navigate]);

    async function playOnline() {
        const result = await playerName();

        if (!result.isConfirmed) {
            return;
        }

        const name = result.value;
        setUsername(name);

        socket?.on("OpponentNotFound", () => {
            setOpponent(false);
        });
    
        socket?.on("OpponentFound", (data) => {
            setPlayingAs(data.playingAs);
            setOpponent(data.opponent);
        });

        socket?.emit("request_to_play", { 
            playername: name
        });
    }

    const playerName = async () => {
        const result = await Swal.fire({
            title: "Enter your name",
            input: "text",
            inputPlaceholder: "Your Name",
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return "You need to write something!";
                }
            }
        });
        return result;
    };

    return (
        <div className="home">
            {username && !opponent ? (
                <div className="waiting">
                    <p>Waiting For Opponent!!</p>
                </div>
            ) : (
                <div className="play">
                    {!username && (
                        <button onClick={playOnline} className="button">Play</button>
                    )}
                </div>
            )}
        </div>
    );
}

export default Home;
