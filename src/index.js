const PiCam = require('./components/picam')

const config = {
  bucket: 'foosman',
  keyPrefix: 'picam/',
}

const cam = new PiCam(config)
cam.start()
