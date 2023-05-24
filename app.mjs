#!/usr/bin/env node

import fs from 'fs';
import SerialDriver from "./serialDriver.mjs";
import TerminalDriver from "./terminalDriver.mjs";
import mqtt from "mqtt";

var config = {};
var mqttClient = undefined;
var serialBridge = undefined;
var terminalBridgeObj = {};

function loadConfig(loadPath) {
    try {
        var configData = fs.readFileSync(loadPath, {encoding:'utf8', flag:'r'});
        config = JSON.parse(configData);
    } catch(error) {
        console.error(error);
        throw "Cannot load config file";
    }
    
}

function parseCommand(args) {
    if(args.length == 0) {
        console.log("using default config file location: config.json");
        args = ["config","config.json"];
    }
    switch(args[0]) {
        case "config":
            loadConfig(args[1]);
            mqttClient = mqtt.connect(config.mqttConnectionString);
            main(config);
        break;

        default:
            console.log("USE COMMAND LINE ARGUMENT `config` to provide config file path");
            process.exit(1);
        break;
    }
}


function main(config) {
    switch(config.mode) {
        case "serial":
            serialBridge = new SerialDriver(config.port,config.baud,config.dataFormat);
            serialBridge.eventHandler.on("data",(data)=>{
                if(typeof mqttClient != "undefined") {
                    mqttClient.publish(config.outputTopic,data);
                }
            });
        break;
        
    }
}

var args = process.argv.slice(2);
parseCommand(args)


mqttClient.on('connect', function () {
    console.log("CLIENT CONNECTED TO "+config.mqttConnectionString);
    
    mqttClient.subscribe(config.commandTopic, function (err) {
        if (!err) {
          console.log("SUBSCRIBED TO COMMAND TOPIC "+config.commandTopic);
        }
    })
    
    if(config.mode=="serial") {
        mqttClient.subscribe(config.inputTopic, function (err) {
            if (!err) {
              console.log("SUBSCRIBED TO INPUT TOPIC "+config.inputTopic);
            }
        })
    }
  })
  
  mqttClient.on('message', function (topic, message) {
    message = message.toString();
    if(topic.includes(config.inputTopic)) {
        switch(config.mode) {
            case "serial":
                if(typeof serialBridge !="undefined") {
                    serialBridge.writeData(message);
                }
            break;

            case "terminal":
                var parsedMessage = JSON.parse(message);
                if(typeof terminalBridgeObj[parsedMessage.sessionID] !="undefined") {
                    terminalBridgeObj[parsedMessage.sessionID].writeData(parsedMessage.data);
                }
            break;
    
            default:
                console.log("MODE NOT IMPLEMENTED");
            break;
        }
    }

    if(topic==config.commandTopic) {
        var parsedMessage = JSON.parse(message);
        switch(parsedMessage.cmd) {
            case "terminate":
                console.log("RECEIVED TERMINATE COMMAND...TERMINATING");
                process.exit(1);
            break;

            case "resize_terminal":
                try {
                    terminalBridgeObj[parsedMessage.sessionID].resize(parsedMessage.data);
                } catch(error) {

                }
            break;

            case "start_terminal_session":
                terminalBridgeObj[parsedMessage.sessionID] = new TerminalDriver(config.shell,3600*1000);
                terminalBridgeObj[parsedMessage.sessionID].eventHandler.on("data",(data)=>{
                    if(typeof mqttClient != "undefined") {
                        mqttClient.publish(config.outputTopic+"/"+parsedMessage.sessionID,data);
                    }
                });

                terminalBridgeObj[parsedMessage.sessionID].eventHandler.on("session",(data)=>{
                    try {
                        terminalBridgeObj[parsedMessage.sessionID].stop();
                    } catch(error) {
    
                    }
                    if(typeof mqttClient != "undefined") {
                        mqttClient.publish(config.outputTopic+"/"+parsedMessage.sessionID,"Session expired...");
                    }
                });

                mqttClient.subscribe(config.inputTopic+"/"+parsedMessage.sessionID, function (err) {
                    if (!err) {
                      console.log("SUBSCRIBED TO INPUT TOPIC "+config.inputTopic+"/"+parsedMessage.sessionID);
                    }
                });

                terminalBridgeObj[parsedMessage.sessionID].start();
            break;
            
            case "stop_terminal_session":
                try {
                    terminalBridgeObj[parsedMessage.sessionID].stop();
                } catch(error) {

                }
            break;
        }
    }
});

mqttClient.on("error",()=>{
    console.error("Cannot connect to mqtt server");
    process.exit(1);
});

process.on('uncaughtException', function(error) {
    console.error(error);
    process.exit(1)
});
