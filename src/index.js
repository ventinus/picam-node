const PiCam = require('./utils/picam')

const wait = (delay = 5000) => new Promise((res) => setTimeout(res, delay))

const config = {
  bucket: 'foosman',
  keyPrefix: 'picam/'
}

;(async function() {
  const cam = new PiCam(config)
  await cam.start()
  cam.record(true)

  await wait(20000)

  cam.record(false)
  cam.stop()
})()
