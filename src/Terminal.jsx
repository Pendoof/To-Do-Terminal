import React, { useEffect, useRef, useState } from "react";
import "./Terminal.css";

export default function Terminal({}) {
    const cmdlineRef = useRef(null);
    const scrollContainer = useRef(null);
    const [log, setLog] = useState([]);
    // TODO: Replace with actual user address logic
    const [address, setAddress] = useState("@temp user address");
    const [input, setInput] = useState("");

    function placeCaretAtEnd(el) {
        // Places caret at end of contenteditable element
        if (!el) return;
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Adds alphanumeric characters to input even when cmdline is not focused and focuses it
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                if (document.activeElement !== cmdlineRef.current) {
                    e.preventDefault();
                    cmdlineRef.current.focus();
                    setInput((prev) => prev + e.key);
                    cmdlineRef.current.textContent = input;
                    setTimeout(() => placeCaretAtEnd(cmdlineRef.current), 0);
                }
            }
            // Handles Enter key to submit command
            if (e.key === "Enter") {
                // TODO: Add command processing logic here
                e.preventDefault();
                setLog((prev) => [...prev, address, input.trim()]);
                setInput("");
                cmdlineRef.current.textContent = "";
            }
            // TODO: Add tab completion and history navigation
            // TODO: Add Backspace handling when not focused
            // TODO: Add blinking cursor
        };

        // Attach keydown listener and remove on cleanup
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [input]);

    // Scroll to command line when log or input changes
    useEffect(() => {
        if (scrollContainer.current) {
            scrollContainer.current.scrollTop = scrollContainer.current.scrollHeight;
        }
    }, [input, log]);

    return (
        <div id="terminal-container" ref={scrollContainer}>
            <div id="terminal-log">
                {/* Combines log entries into address and command pairs */}
                {log.reduce((acc, line, i, arr) => {
                    if (i % 2 === 0) {
                        acc.push(
                            <div key={i} className="log-entry">
                                <div className="address">{line}</div>
                                {arr[i + 1] !== undefined && (
                                    <div className="cmd">
                                        <span className="prompt">&gt;</span>
                                        <div>{arr[i + 1]}</div>
                                    </div>
                                )}
                            </div>
                        );
                    }
                    return acc;
                }, [])}
            </div>

            <div id="terminal-input">
                <div className="address" onChange={(e) => setAddress(e.target.value)}>
                    @temp user address
                </div>
                <div id="input">
                    <span className="prompt">&gt;</span>
                    <div
                        className="cmd"
                        ref={cmdlineRef}
                        contentEditable
                        suppressContentEditableWarning
                        spellCheck={false}
                        tabIndex={0}
                        onInput={(e) => setInput(e.currentTarget.textContent)}
                    />
                </div>
            </div>
        </div>
    );
}
