import { SerialPort } from 'serialport';
import EventEmitter from 'events';
class SerialDriver {
    // mode: hexstring - convert from hex string to buffer on the fly
    constructor(port,baud,mode="raw") {
        this.port = port;
        this.baud = baud;
        this.mode = mode;
        this.eventHandler = new EventEmitter();
        this.portHandler = new SerialPort({ path: this.port, baudRate: this.baud });
        this.portHandler.on("data",(data)=>{
            var parsedData = undefined;
            switch(this.mode) {

                case "hexstring":
                    parsedData = data.toString("hex")
                break;

                case "raw":
                default:
                    parsedData = data;
                break;

            }
            this.eventHandler.emit("data",parsedData);
        })

        this.portHandler.on("error",(error)=>{
            throw error;
        })
    }

    writeData(data) {
        var parsedData = undefined;
        switch(this.mode) {
            case "hexstring":
                parsedData = Buffer.from(data,"hex");
            break;

            case "raw":
            default:
                parsedData = data;
            break;
        }
        this.portHandler.write(parsedData,function(err){
            if(err) {
                throw "Error on write "+err.message;
            }
        });
    }

}

export default SerialDriver;