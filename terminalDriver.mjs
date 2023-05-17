import EventEmitter from 'events';
import pty from 'node-pty';

class TerminalDriver {
    // shellName: bash - for linux, cmd.exe - for windows
    constructor(shellName) {
        this.shell = shellName;
        this.eventHandler = new EventEmitter();
        this.ttyHandler = pty.spawn(this.shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.env.HOME,
            env: process.env
        });

        this.ttyHandler.on("data",(data)=>{
            this.eventHandler.emit("data",data);
        })

        this.ttyHandler.on("error",(error)=>{
            throw error;
        })
    }

    writeData(data) {
        this.ttyHandler.write(data);
    }

    resize(resizeData) {
        this.ttyHandler.resize(resizeData.cols,resizeData.rows);
    }

}

export default TerminalDriver;