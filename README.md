# MQTT_BRIDGE


A simple package that allows you to create a bridge between mqtt and a serial port

## INSTALLATION 

```
npm install -g mqtt_bridge
```

## HOW TO USE

1. Create config json file. allowed parameters:

 - mqttConnectionString - mqtt connection string ex: "mqtt://test.mosquitto.org", follow [MQTT.js](https://github.com/mqttjs/MQTT.js) to determine correct connection string
 - mode - only available "serial" for now,
 - baud - baudrate for serial device,
 - port - serial port id,
 - dataFormat -  "hexstring" or "raw". In "hexstring" dataformat Buffer bytes from serial are converted to hexstring. Hex string values published to mqtt are converted to buffer,
 - inputTopic - topic for publishing data TO device,
 - outputTopic - Topic where you can receive data from device

 Example config file:

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

 2. execute command:

 ```
 mqtt_bridge config <path to your config json file>
 ```
 