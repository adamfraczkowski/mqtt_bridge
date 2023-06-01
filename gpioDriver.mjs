import EventEmitter from 'events'
import { execSync }  from "child_process";

class gpioDriver {

    constructor(pinsConfig,refreshInterval=300,longpressTime=1000) {
        this.eventHandler = new EventEmitter();        
        this.pollingTimeoutHandler = undefined;
        this.softwarePollingEnabled = false;
        this.pinsConfig = pinsConfig;
        this.pinsState = [];
        this.refreshInterval = refreshInterval;
        this.longpressTime = longpressTime

        for(var i=0;i<this.pinsConfig.length;i++) {
            try {
                execSync("gpio mode "+this.pinsConfig[i].pin+" "+this.pinsConfig[i].dir);
                execSync("gpio mode "+this.pinsConfig[i].pin+" "+this.pinsConfig[i].pull);
            } catch(error) {
                console.error("CANNOT SET PIN "+this.pinsConfig[i].pin);
            }
            if(this.pinsConfig[i].dir=="in") {
                this.pinsState.push({pin:this.pinsConfig[i].pin,
                    dir:this.pinsConfig[i].dir,
                    timestamp:new Date().getTime(),
                    value:false,
                    event:undefined
                });
            }
        }

    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getPin(pin) {
        var value = execSync("gpio read "+pin);
        if(value.includes("0")) return false;
        if(value.includes("1")) return true;
    }

    setPin(pin,value) {
        execSync("gpio write "+pin+" "+value);
        return true;
    }

    async blinkPin(pin,onTime,offTime,times) {
        for(var i=0;i<times;i++) {
            this.setPin(pin,"1");
            await this.sleep(onTime);
            this.setPin(pin,"0");
            await this.sleep(offTime);
        }
    }

    writeData(msg) {
        switch(msg.cmd) {
            case "start":
                this.start();
            break;

            case "stop":
                this.stop();
            break;

            case "setpin":
                this.setPin(msg.data.pin,msg.data.value)
            break;

            case "blinkpin":
                this.blinkPin(msg.data.pin,msg.data.onTime,msg.data.offTime,msg.data.times);
            break;
        }
    }

    start() {
        this.softwarePollingEnabled = true;
        this.pollingTimeoutHandler = setTimeout(async()=>this.softwarePoolLoop(),this.refreshInterval);
        
    }
  
    stop() {
        this.softwarePollingEnabled = false;
        if(typeof this.pollingTimeoutHandler !== "undefined") {
            clearInterval(this.pollingTimeoutHandler);
        }
        
    }
  
    async softwarePoolLoop() {
        if(this.softwarePollingEnabled == true) {
          try {
            for(var i=0;i<this.pinsState.length;i++) {
                var response = await this.getPin(this.pinsState[i].pin);
                if(this.pinsState[i].value!=response) {
                    this.pinsState[i].value = response;
                    this.pinsState[i].timestamp = new Date().getTime();
                    this.eventHandler.emit("gpiochange",this.pinsState[i]);
                    if(this.pinsState[i].event == "longpress" && this.pinsState[i].value==false) {
                        this.pinsState[i].event = undefined;
                    }
                    else if(this.pinsState[i].value==false) {
                        this.pinsState[i]["event"] = "press";
                        this.eventHandler.emit("gpio",this.pinsState[i]);    
                    }
                }
                if(this.pinsState[i].value==true) {
                    if((new Date().getTime() - this.pinsState[i].timestamp)>this.longpressTime && this.pinsState[i].event!="longpress") {
                        this.pinsState[i].timestamp = new Date().getTime();
                        this.pinsState[i]["event"] = "longpress";
                        this.eventHandler.emit("gpio",this.pinsState[i]);                      
                    }
                } 
                
            }
            
          } catch(error) {
            console.log(error);
          }
          this.pollingTimeoutHandler = setTimeout(async()=>this.softwarePoolLoop(),this.refreshInterval);
        }
    }
}

export default gpioDriver;

