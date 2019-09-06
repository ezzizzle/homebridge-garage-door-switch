# homebridge-garage-door-switch

[Homebridge](https://github.com/nfarina/homebridge) plugin that supports triggering commands to open and close a garage door.
Also allows setting the state from an external source using HTTP requests.

Took a lot of inspiration from [apexad/homebridge-garagedoor-command](https://github.com/apexad/homebridge-garagedoor-command), thanks!

# Installation

1. Install [Homebridge](https://github.com/nfarina/homebridge)
2. Install this plugin using `npm install -g homebridge-garage-door-switch`
3. Configure the plugin as below

# Configuration

Sample configuration

```json
    "accessories": [
        {
            "accessory": "EzzGarageDoorSwitch",
            "name": "Garage Door",
            "open": "/path/to/open_command.sh",
            "close": "/path/to/close_command.sh",
            "debug": true,
            "httpPort": 8965
        },
    ]
```

## Explanation

Field                   | Description
------------------------|------------
**accessory**           | Must always be "EzzGarageDoorSwitch". (required)
**name**                | Name of the Garage Door
**open**                | Command to run to open the Garage Door. Examples: `bash open.sh` or `node open.js` (required)
**close**               | Command to run to close the Garage Door. Examples: `bash close.sh` or `node close.js` (required)

The open and close commands must return the following verbs: OPENING, CLOSING.

# How Can I Use This?

This package solves a particular itch for me. I'm using it in the following way. It's cumbersome and horrible but it works. :-)

## Opening the Door

* Raspberry Pi running Homebridge
* Raspberry Pi GPIO connections to an RF garagedoor opener
* Python script to 'push' the open/close buttons on the garage door opener

## Monitoring the State

* [Eve Door/Window](https://www.evehome.com/en/eve-door-window) sensor mounted on the garage door

## Updating the State

* HomeKit automation to run when the Eve Door sensor changes state
* The automation triggers a [homebridge-http-switch](https://www.npmjs.com/package/homebridge-http-switch) that sends a request to the `homebridge-garage-door-switch` server to update the door's state
