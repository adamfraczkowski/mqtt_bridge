#!/usr/bin/env node

import fs from 'fs';
import SerialDriver from "./serialDriver.mjs";
import mqtt from "mqtt";

var config = {};
var mqttClient = undefined;
var serialBridge = undefined;


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
        
        default:
            console.log("MODE NOT IMPLEMENTED");
        break;
    }
}

var args = process.argv.slice(2);
parseCommand(args)

process.on('uncaughtException', function(error) {
    console.error(error);
    process.exit(1)
});

mqttClient.on('connect', function () {
    console.log("CLIENT CONNECTED TO "+config.mqttConnectionString);
    mqttClient.subscribe(config.inputTopic, function (err) {
      if (!err) {
        console.log("SUBSCRIBED TO INPUT TOPIC "+config.inputTopic);
      }
    })

    mqttClient.subscribe(config.commandTopic, function (err) {
        if (!err) {
          console.log("SUBSCRIBED TO COMMAND TOPIC "+config.commandTopic);
        }
    })
  })
  
  mqttClient.on('message', function (topic, message) {
    message = message.toString();
    if(topic==config.inputTopic) {
        switch(config.mode) {
            case "serial":
                if(typeof serialBridge !="undefined" && topic == config.inputTopic) {
                    serialBridge.writeData(message);
                }
            break;
    
            default:
                console.log("MODE NOT IMPLEMENTED");
            break;
        }
    }

    if(topic==config.commandTopic) {
        switch(message) {
            case "terminate":
                console.log("RECEIVED TERMINATE COMMAND...TERMINATING");
                process.exit(1);
            break;
        }
    }
});