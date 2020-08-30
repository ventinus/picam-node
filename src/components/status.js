const { Gpio } = require('onoff')

const pin = 17
const led = new Gpio(pin, 'out')

module.exports = {
  ledOn: () => led.writeSync(1),
  ledOff: () => led.writeSync(0),
}
