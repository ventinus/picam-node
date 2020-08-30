const { Gpio } = require('onoff')
const button = new Gpio(4, 'in', 'both')

exports.startButton = (onPress) => button.watch(onPress)
