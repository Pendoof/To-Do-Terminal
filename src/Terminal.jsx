import React, { useEffect, useRef, useReducer, useState } from "react";
import "./Terminal.css";

const INITIAL_STATE = {
    cwd: "C:/",
    fs: {
        "C:/": { type: "dir", children: [] },
    },
    error: null,
};

function join(a, b) {
    return a.endsWith("/") ? a + b : a + "/" + b;
}

function reducer(state, action) {
    switch (action.type) {
        case "MKDIR": {
            const path = join(state.cwd, action.name);
            if (state.fs[path]) return state;

            return {
                ...state,
                fs: {
                    ...state.fs,
                    [state.cwd]: {
                        ...state.fs[state.cwd],
                        children: [...state.fs[state.cwd].children, action.name],
                    },
                    [path]: { type: "dir", children: [] },
                },
            };
        }

        case "ADD": {
            const path = join(state.cwd, action.name);
            if (state.fs[path]) return state;

            return {
                ...state,
                fs: {
                    ...state.fs,
                    [state.cwd]: {
                        ...state.fs[state.cwd],
                        children: [...state.fs[state.cwd].children, action.name],
                    },
                    [path]: {
                        type: "task",
                    },
                },
            };
        }

        case "CD": {
            let target;

            if (action.path === "..") {
                target = state.cwd.split("/").slice(0, -1).join("/") || "C:/";
            } else if (action.path.startsWith("C:/")) {
                target = action.path;
            } else {
                target = join(state.cwd, action.path);
            }

            if (!state.fs[target] || state.fs[target].type !== "dir") {
                return { ...state, error: `cd: not a directory: ${action.path}` };
            }

            return { ...state, cwd: target, error: null };
        }

        case "REMOVE": {
            const path = join(state.cwd, action.name);

            if (!state.fs[path]) return state;

            const { [path]: removed, ...newFs } = state.fs;

            return {
                ...state,
                fs: {
                    ...newFs,
                    [state.cwd]: {
                        ...state.fs[state.cwd],
                        children: state.fs[state.cwd].children.filter(
                            (child) => child !== action.name
                        ),
                    },
                },
            };
        }

        default:
            return state;
    }
}

export default function Terminal({}) {
    const cmdlineRef = useRef(null);
    const scrollContainer = useRef(null);
    const [log, setLog] = useState([]);
    const [address, setAddress] = useState("C:/");
    const [input, setInput] = useState("");
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

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
        rm: "Remove a to-do item by its name",
        del: "Alias for rm",
        complete: "Mark a to-do item as completed",

        // Organization / navigation
        mkdir: "Create a new to-do category",
        cd: "Change to a different to-do category",
        pwd: "Show current to-do category",

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

    function print(text) {
        setLog((prev) => [...prev, { prompt: state.cwd, text }]);
    }

    function handleCommand(raw) {
        const [cmd, ...args] = raw.trim().split(" ");
        const name = args.join(" ");

        switch (cmd) {
            case "mkdir": {
                if (args.length === 0) {
                    print("mkdir: missing name. Usage: mkdir <name>");
                    break;
                }
                dispatch({ type: "MKDIR", name });
                print(raw);
                break;
            }

            case "new":
            case "add": {
                if (args.length === 0) {
                    print(`${cmd}: missing name. Usage: ${cmd} <name>`);
                    break;
                }
                dispatch({ type: "ADD", name });
                print(raw);
                break;
            }

            case "cd": {
                if (args.length === 0) {
                    setLog((prev) => [
                        ...prev,
                        address,
                        "cd: missing folder. Usage: cd <directory>",
                    ]);
                    break;
                }
                dispatch({ type: "CD", path: args[0] });
                print(raw);
                setAddress(state.cwd);
                break;
            }

            case "pwd": {
                print(state.cwd);
                break;
            }

            case "list":
            case "ls": {
                const dir = state.fs[state.cwd];
                if (!dir) {
                    print("Invalid directory");
                    return;
                }
                
                const folders = [];
                const tasks = [];

                dir.children.forEach((name) => {
                    const node = state.fs[join(state.cwd, name)];
                    if (!node) return;

                    if (node.type === "dir") {
                        folders.push(name + "/");
                    } else {
                        tasks.push(name);
                    }
                });

                const children = [...folders, ...tasks];

                print(children.join("  ") || "No items found");
                break;
            }

            case "remove":
            case "rm": {
                if (args.length === 0) {
                    print(`${cmd}: missing name. Usage: ${cmd} <name>`);
                    break;
                }

                dispatch({ type: "REMOVE", name });
                print(raw);
                break;
            }

            case "help": {
                if (args.length === 0) {
                    // General help
                    print(
                        `Available commands:\n${Object.entries(COMMANDS)
                            .map(([cmd, desc]) => `${cmd.padEnd(12)} ${desc}`)
                            .join("\n")}`
                    );
                } else {
                    // Help for a specific command
                    const target = args[0];
                    if (COMMANDS[target]) {
                        print(`${target}: ${COMMANDS[target]}`);
                    } else {
                        print(`help: unknown command "${target}"`);
                    }
                }
                break;
            }

            case "clear":
            case "cls": {
                setLog([]);
                break;
            }

            default: {
                print(`Error: Command "${input.trim()}" not found. Type "help" for a list of commands.`);
                break;
            }
        }
    }

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Adds alphanumeric characters to input even when cmdline is not focused and focuses it
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                if (document.activeElement !== cmdlineRef.current) {
                    e.preventDefault();
                    cmdlineRef.current.focus();
                    setCmdline(input + e.key);
                }
            }

            // Handles Enter key to submit command
            if (e.key === "Enter") {
                e.preventDefault();
                handleCommand(input.toLowerCase());
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

    useEffect(() => {
        if (state.error) {
            print(state.error);
        }
    }, [state.error]);

    return (
        <div id="terminal-container" ref={scrollContainer}>
            <div id="terminal-log">
                {/* Combines log entries into address and command pairs */}
                {log.map((entry, i) => (
                    <div key={i} className="log-entry">
                        <div className="address">{entry.prompt}</div>
                        <div className="cmd">
                            <span className="prompt">&gt;</span>
                            <div>{entry.text}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div id="terminal-input">
                <div className="address" onChange={(e) => setAddress(e.target.value)}>
                    {state.cwd}
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
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
