import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './home/Home';
import Game from './game/Game';

function App() {
    return (
        <div>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/game" element={<Game />} />
            </Routes>
        </div>
    );
}

export default App;
