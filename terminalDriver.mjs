import EventEmitter from 'events';
import pty from 'node-pty';
import { Watchdog } from "watchdog";

class TerminalDriver {
    // shellName: bash - for linux, cmd.exe - for windows
    constructor(shellName, sessionTimeout=3600) {
        this.shell = shellName;
        this.eventHandler = new EventEmitter();
        this.ttyHandler = undefined;
        this.sessionWatchdog = new Watchdog(sessionTimeout)
        this.sessionWatchdog.on("reset",()=>{
            this.stop();
            this.eventHandler.emit("session","expired");
        })
    }

    writeData(data) {
        if(typeof this.ttyHandler !== "undefined") {
            this.ttyHandler.write(data);
            this.sessionWatchdog.feed("dummy");
        }
    }

    resize(resizeData) {
        if(typeof this.ttyHandler!== "undefined") {
            this.ttyHandler.resize(resizeData.cols,resizeData.rows);
            this.sessionWatchdog.feed("dummy");
        }
    }

    start() {
        this.ttyHandler = pty.spawn(this.shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.env.HOME,
            env: process.env
        });
        
        this.ttyHandler.on("data",(data)=>{
            this.sessionWatchdog.feed("dummy");
            this.eventHandler.emit("data",data);
        })

        this.ttyHandler.on("error",(error)=>{
            throw error;
        })
    }

    stop() {
        if(typeof this.ttyHandler != "undefined") {
            this.ttyHandler.kill();
            this.ttyHandler = undefined;
        }
        
    }



}

export default TerminalDriver;