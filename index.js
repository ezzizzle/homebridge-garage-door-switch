let Service, Characteristic

const http = require('http')
const exec = require('child_process').exec
const util = require('util')
const { createServer } = require('./lib/server')

module.exports = function(homebridge) {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('garage-door-switch', 'EzzGarageDoorSwitch', GDSwitch)
}

function GDSwitch(log, config) {
  this.log = log
  this.name = config.name
  this.openCommand = config.open
  this.closeCommand = config.close
  this.stateCommand = config.state || undefined
  this.debug = config.debug || false
  this.pollStateTime = config.pollStateTime * 1000 || 15000
  this.httpPort = config.httpPort

  this.checkStateTimer = null

  const accessory = this

  // this.getCurrentState(function(err) {
  //   if (err) {
  //     this.log(`ERROR on startup state check: ${err}`)
  //   }
  // })

  // Start a web server to listen for external state changes
  createServer(accessory)
}

GDSwitch.prototype.setTargetState = function(targetState, callback, context) {
  const accessory = this
  const currentState = accessory.garageDoorService.getCharacteristic(Characteristic.CurrentDoorState).value

  // if (targetState === currentState) {
  //   callback(null)
  //   return
  // }

  if (accessory.debug) accessory.log(`Transitioning to ${targetState}`)

  if (!context) {
    // If there's no context the command has come from inside the class
    // Don't run the command to update state, just set it
    // This allows us to set the value from an external source, not from within the Home app
    callback(null)
    return
  }

  if (targetState === Characteristic.TargetDoorState.OPEN) {
    exec(accessory.openCommand, function (error, stdout, stderr) {
      if (error) {
        accessory.log(`ERROR Opening Door: ${error}`)
        callback(error, null)
        return
      }

      accessory.garageDoorService.setCharacteristic(
        Characteristic.TargetDoorState, Characteristic.TargetDoorState.OPEN)
      callback(null)
    })
  } else if (targetState === Characteristic.TargetDoorState.CLOSED) {
    exec(accessory.closeCommand, function (error, stdout, stderr) {
      if (error) {
        accessory.log(`ERROR Closing Door: ${error}`)
        callback(error, null)
        return
      }

      accessory.garageDoorService.setCharacteristic(
        Characteristic.TargetDoorState, Characteristic.TargetDoorState.CLOSED)
      callback(null)
    })
  }
}

/**
 * Get the current state from the external command
 *
 * This should reflect the actual state of the garage door
 *
 * @param {*} callback Function to be called after the state has been retrieved
 */
GDSwitch.prototype.getCurrentState = function(callback) {
  const accessory = this

  const currentState = accessory.garageDoorService.getCharacteristic(Characteristic.CurrentDoorState).value
  const currentTargetState = accessory.garageDoorService.getCharacteristic(Characteristic.TargetDoorState).value
  callback(null, currentState, currentTargetState)

  // TODO: Implement a state command that will automatically refresh at a given interval
  // exec(accessory.stateCommand, function (error, stdout, stderr) {
  //   if (error) {
  //     accessory.log(`ERROR Getting State: ${error}`)
  //     callback(error, null)
  //     return
  //   }

  //   const returnedState = stdout.toString('utf-8').trim()
  //   const currentTargetState = accessory.garageDoorService.getCharacteristic(Characteristic.TargetDoorState).value
  //   callback(null, Characteristic.CurrentDoorState[returnedState], currentTargetState)
  // })

  // if (accessory.checkStateTimer) {
  //   clearTimeout(accessory.checkStateTimer)
  //   accessory.checkStateTimer = null
  // }

  // accessory.checkStateTimer = setTimeout(function() { accessory.checkState() }, accessory.pollStateTime)
}

/**
 * Gets and Sets the correct state
 *
 * Runs the getCurrentState command to retrieve the true garage door state.
 * If the state has changed from what Homebridge believes it to be the CurrentDoorState and TargetDoorState values are updated.
 * You must set the TargetDoorState correctly or else the Home app assumes you are in the transition state (Opening/Closing)
 */
GDSwitch.prototype.checkState = function() {
  const accessory = this

  accessory.getCurrentState(function(err, actualState, targetState) {
    if (err) {
      accessory.log(`ERROR Getting state: ${err}`)
      return
    }

    accessory.setCurrentState(actualState)
  })
}

/**
 * Sets the Current State of the Door
 *
 * @param {number} actualState The actual state of the GarageDoor as a number
 */
GDSwitch.prototype.setCurrentState = function(actualState) {
  const accessory = this

  const currentReportedState = accessory.garageDoorService.getCharacteristic(Characteristic.CurrentDoorState).value
  const currentTargetState = accessory.garageDoorService.getCharacteristic(Characteristic.TargetDoorState).value

  if (accessory.debug) accessory.log(`currentReportedState: ${currentReportedState} CurrentTargetState: ${currentTargetState} actualState: ${actualState}`)

  if (currentTargetState !== actualState) {
    // If TargetState isn't set correctly the Home app gets confused and will show opening/closing instead of the right state
    accessory.garageDoorService.setCharacteristic(Characteristic.TargetDoorState, actualState)
  }

  if (currentReportedState === actualState) {
    return
  }

  accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, actualState)
}

GDSwitch.prototype.getServices = function() {
  let informationService = new Service.AccessoryInformation()
  informationService
    .setCharacteristic(Characteristic.Manufacturer, 'GDSwitches')
    .setCharacteristic(Characteristic.Model, '001')
    .setCharacteristic(Characteristic.SerialNumber, 'GDS-001')
    .setCharacteristic(Characteristic.FirmwareRevision, '0.0.1')

  let garageDoorService = new Service.GarageDoorOpener(this.name)

  garageDoorService.getCharacteristic(Characteristic.TargetDoorState)
    .on('set', this.setTargetState.bind(this))

  garageDoorService.getCharacteristic(Characteristic.CurrentDoorState)
    .on('get', this.getCurrentState.bind(this))

  this.informationService = informationService
  this.garageDoorService = garageDoorService

  return [informationService, garageDoorService]
}
