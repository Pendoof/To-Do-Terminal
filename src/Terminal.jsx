import React, { useEffect, useRef, useState } from "react";
import "./Terminal.css";

export default function Terminal({}) {
    const cmdlineRef = useRef(null);
    const scrollContainer = useRef(null);
    const [log, setLog] = useState([]);
    // TODO: Replace with actual user address logic
    const [address, setAddress] = useState("@User");
    const [input, setInput] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [refreshSuggestions, setRefreshSuggestions] = useState(true);

    const COMMANDS = {
        // System commands
        help: "List commands or show help for a specific command",
        clear: "Clear the terminal",
        cls: "Alias for clear",

        // To-do commands
        add: "Add a new to-do item",
        new: "Alias for add",
        ls: "List to-do items",
        list: "Alias for ls",
        view: "View details of a to-do item",
        edit: "Edit an existing to-do item",
        rm: "Remove a to-do item by its name",
        del: "Alias for rm",
        complete: "Mark a to-do item as completed",
        uncomplete: "Mark a completed to-do item as active",

        // Organization / navigation
        mkdir: "Create a new to-do category",
        cd: "Change to a different to-do category",
        pwd: "Show current to-do category",
        mv: "Move a to-do item to another category",
        rename: "Rename a to-do category",

        // Filtering & search
        find: "Search to-do items by keyword",
        filter: "Filter to-do items by status or priority",
        sort: "Sort to-do items (by date, priority, or status)",

        // Metadata
        priority: "Set or change priority of a to-do item",
        due: "Set or update a due date",
        tag: "Add or remove tags from a to-do item",

        // Session data storage
        save: "Save session state to browser storage",
        load: "Load session state from browser storage",
    };

    // Places caret at end of contenteditable element
    function placeCaretAtEnd(el) {
        if (!el) return;
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    function setCmdline(text) {
        setInput(text);
        cmdlineRef.current.textContent = text;
        placeCaretAtEnd(cmdlineRef.current);
    }

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Adds alphanumeric characters to input even when cmdline is not focused and focuses it
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                if (document.activeElement !== cmdlineRef.current) {
                    e.preventDefault();
                    cmdlineRef.current.focus();
                    setCmdline(input + e.key);
                    setSuggestions([]);
                    setSuggestionIndex(0);
                    setRefreshSuggestions(true);
                }
            }

            // Handles Tab key for autocomplete
            if (e.key === "Tab") {
                e.preventDefault();
                const text = cmdlineRef.current.textContent.trim().toLowerCase();
                const parts = text.split(/\s+/);
                let matches = suggestions;
                let refresh = refreshSuggestions;
                // autocomplete only for first part (command name)
                if (parts.length === 1) {
                    if (refresh || text === "") {
                        matches = Object.keys(COMMANDS).filter((cmd) =>
                            // modify to work with multiple parts
                            cmd.startsWith(parts[0])
                        );
                        setSuggestions(matches);
                        setSuggestionIndex(0);
                        setRefreshSuggestions(false);
                    }

                    // Use the stored matches from state for cycling
                    if (matches.length === 0) return;
                    const next = matches[suggestionIndex % matches.length];
                    setSuggestionIndex((i) => i + 1);
                    setCmdline(next);
                }
            }

            // Handles Enter key to submit command
            if (e.key === "Enter") {
                e.preventDefault();
                const [command, ...args] = input.trim().toLowerCase().split(" ");
                switch (command) {
                    case "help": {
                        if (args.length === 0) {
                            // General help
                            setLog((prev) => [
                                ...prev,
                                address,
                                `Available commands:\n${Object.entries(COMMANDS)
                                    .map(([cmd, desc]) => `${cmd.padEnd(12)} ${desc}`)
                                    .join("\n")}`,
                            ]);
                        } else {
                            // Help for a specific command
                            const target = args[0];
                            if (COMMANDS[target]) {
                                setLog((prev) => [
                                    ...prev,
                                    address,
                                    `${target}: ${COMMANDS[target]}`,
                                ]);
                            } else {
                                setLog((prev) => [
                                    ...prev,
                                    address,
                                    `help: unknown command '${target}'`,
                                ]);
                            }
                        }
                        break;
                    }
                    case "clear":
                    case "cls": {
                        setLog([]);
                        break;
                    }

                    // TODO: Implement other commands here

                    default: {
                        setLog((prev) => [
                            ...prev,
                            address,
                            `Error: Command "${input.trim()}" not found. Type "help" for a list of commands.`,
                        ]);
                        break;
                    }
                }
                setInput("");
                cmdlineRef.current.textContent = "";
                setSuggestions([]);
                setSuggestionIndex(0);
                setRefreshSuggestions(true);
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
                    @User
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
                        onInput={(e) => {
                            setInput(e.currentTarget.textContent);
                            setRefreshSuggestions(true);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
