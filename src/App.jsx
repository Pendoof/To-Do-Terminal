import React, { useref } from "react";
import Terminal from "./Terminal";
import "./App.css";

function App() {
    return (
        <>
            <header>
                <div id="window-controls">
                    <div className="close"></div>
                    <div className="minimize"></div>
                    <div className="maximize"></div>
                </div>
                <div id="app-name">To Do Terminal</div>
            </header>
            <Terminal />
        </>
    );
}

export default App;
