const AWS = require('aws-sdk')
const fs = require('fs')
const { exec } = require('child_process')
const kill = require('tree-kill')
const { ledOn, ledOff } = require('./status')
const { startButton } = require('./button')

const s3 = new AWS.S3()

const defaultConfig = {
  duration: 10000,
  keyPrefix: '',
  region: 'us-east-1',
}

const wait = (duration = 5000) => new Promise((resolve) => setTimeout(resolve, duration))

class PiCam {
  constructor(config = {}) {
    this.config = {
      ...defaultConfig,
      ...config,
    }
    if (!this.config.bucket) {
      throw new Error('config property `bucket` is required!')
    }
    if (!this.config.dir) {
      throw new Error('config property `dir` is required!')
    }
    this.dir = config.dir
    this.commands = {
      start: `touch ${this.dir}/hooks/start_record`,
      stop: `touch ${this.dir}/hooks/stop_record`,
    }
    AWS.config.update({ region: this.config.region })
    this.picamProcess = null
    this.segmentId = 0
    this.filename = ''
    this.recording = false
    this.canRecord = false
    this.buttonPressed = false
    startButton(this.onButtonPress.bind(this))
    process.on('exit', this.stop.bind(this))
  }

  onButtonPress(err, value) {
    if (err) console.log(err)
    if (this.buttonPressed && value === 1) {
      this.buttonPressed = false
      // do something
      this.record(!this.recording)
    } else if (!this.buttonPressed && value === 0) {
      this.buttonPressed = true
    }
  }

  // start picam
  start() {
    ledOff()
    const filesToRemove = ['hooks', 'rec', 'state'].map((name) => `${this.dir}/${name}`).join(' ')
    this.picamProcess = exec(`rm ${filesToRemove}`)
    this.picamProcess = exec(`${this.dir}/picam --alsadev hw:1,0`)

    this.picamProcess.stdout.on('data', this.onPicamOutput.bind(this))

    this.picamProcess.stderr.on('data', (data) => {
      console.log(`picam stderr:`, data)
    })

    return new Promise((resolve) => {
      const checkCanRecord = () => {
        if (this.canRecord) {
          resolve()
          return
        }
        setTimeout(checkCanRecord, 1000)
      }
      checkCanRecord()
    })
  }

  // stop picam
  stop(process) {
    console.log('Shutting down')
    this.record(false)
    if (!this.picamProcess) return
    this.picamProcess.stdin.pause()
    kill(this.picamProcess.pid)
  }

  // Record a video
  record(on = true) {
    if (on && !this.recording) {
      ledOn()
      this.recording = true
      this.doSegment()
    } else if (!on && this.recording) {
      this.recording = false
      clearTimeout(this.segmentId)
      exec(this.commands.stop)
      ledOff()
    }
  }

  doSegment() {
    exec(this.commands.start)
    this.segmentId = setTimeout(() => {
      exec(this.commands.stop)
    }, this.config.duration)
  }

  async onPicamOutput(message) {
    console.log('output', message)
    if (message.includes('stop rec') && this.filename) {
      if (this.recording) {
        await wait(1000) // it can take a moment to actually finish recording, there is already a buffer so no worry about missing time
        this.doSegment()
      }
      this.saveChunk(this.filename)
    } else if (message.includes('start rec')) {
      this.filename = message.match(/rec\/archive\/(.+)/)[1]
    } else if (message.includes('capturing started')) {
      this.canRecord = true
      console.log('picam ready')
    }
  }

  async saveChunk(filename) {
    const formattedName = filename.split('_').join('/')
    await wait(1000)
    await s3
      .putObject({
        Key: `${this.config.keyPrefix}${formattedName}`,
        Bucket: this.config.bucket,
        Body: fs.readFileSync(`${this.dir}/rec/archive/${filename}`),
        ContentType: 'video/mp2t',
      })
      .promise()
    exec(`rm ${this.dir}/rec/archive/${filename}`)
  }
}

module.exports = PiCam
