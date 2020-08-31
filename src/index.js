const PiCam = require('./components/picam')

const config = {
  bucket: 'foosman',
  keyPrefix: 'picam/',
  dir: '/home/pi/shared/bodycam'
}

const cam = new PiCam(config)
cam.start()
