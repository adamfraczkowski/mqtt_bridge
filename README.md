# MQTT_BRIDGE


A simple package that allows you to create a bridge between mqtt and a serial port

## INSTALLATION 

```
npm install -g @adamfraczkowski/mqtt_bridge
```

## HOW TO USE

1. Create config json file. allowed parameters:

 - mqttConnectionString - mqtt connection string ex: "mqtt://test.mosquitto.org", follow [MQTT.js](https://github.com/mqttjs/MQTT.js) to determine correct connection string
 - mode - "serial","terminal" or "gpio",
 - baud - baudrate for serial device,
 - port - serial port id,
 - dataFormat -  "hexstring" or "raw". In "hexstring" dataformat Buffer bytes from serial are converted to hexstring. Hex string values published to mqtt are converted to buffer,
 - inputTopic - topic for publishing data TO device,
 - outputTopic - Topic where you can receive data from device
 - commandTopic - Topic where you can send custom command to mqtt bridge. 
 - shell - In terminal mode - terminal shell - for example "cmd.exe", "bash", "powershell.exe"
 - gpioConfig - In gpio mode - JSON object that determine gpio configs - see config_gpio.json

 2. execute command:

 ```
 mqtt_bridge config <path to your config json file>
 ```

## COMMAND LIST

- terminate - command that terminates mqtt bridge. When your device not working well you can try to restart mqtt_bridge executing that command. After that your process manager like  [PM2](https://github.com/Unitech/pm2) can restart your mqtt_bridge process 

 ## GPIO mode

 bridge uses [WiringPI](http://wiringpi.com/) as backend. It uses GPIO tool utility. It should be available in the system as ``gpio`` command. Example:

```
 gpio readall 
```

For banana pi use this version:

[https://github.com/bontango/BPI-WiringPi2](https://github.com/bontango/BPI-WiringPi2)


### GPIO inputs:

Emitted objects (JSON):

```
    {
        "pin":<pin from wiringPI>,
        "dir":<"in"/"out">,
        "timestamp":<timestamp in millis>,
        "value":<true/false>,
        "event":<"press"/"longpress">
    }
```

Objects to send:

```
    {
        "cmd":<"setpin"/"blinkpin"/"start"/"stop">,
        "data":{
            "pin":<pin from wiringPI>,
            "value":<true/false>,
            "onTime":<on time in milliseconds - for blink>,
            "offTime":<off time in milliseconds - for blink>,
            "times":<number of blinks - for blink>
        }
    }
```
 ## Example config file:

serial mode:

 ```
 {
    "mqttConnectionString":"mqtt://test.mosquitto.org",
    "mode":"serial",
    "baud":57600,
    "port":"COM2",
    "dataFormat":"hexstring",
    "inputTopic":"serial-device/input",
    "outputTopic":"serial-device/output"
}
 ```

 terminal mode:

 ```
 {
    "mqttConnectionString":"mqtt://broker.hivemq.com:1883",
    "mode":"terminal",
    "shell":"cmd.exe",
    "inputTopic":"terminal-bridge/input",
    "outputTopic":"terminal-bridge/output",
    "commandTopic":"mqtt-bridge/command"
}
 
 ```

 gpio mode:

 ```
 {
    "mqttConnectionString":"mqtt://broker.hivemq.com:1883",
    "mode":"gpio",
    "gpioConfig":[
        {"pin":15,"dir":"in","pull":"down"},
        {"pin":16,"dir":"in","pull":"down"},
        {"pin":7,"dir":"out","pull":"down"},
        {"pin":8,"dir":"out","pull":"down"},
        {"pin":9,"dir":"out","pull":"down"}
    ],
    "inputTopic":"gpio-bridge/input",
    "outputTopic":"gpio-bridge/output",
    "commandTopic":"gpio-bridge/command"
}
 ```