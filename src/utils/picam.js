const AWS = require('aws-sdk')
const fs = require('fs')
const { exec } = require('child_process')
const kill = require('tree-kill')

const s3 = new AWS.S3()

const FLAGS = []
const OPTS = []

const PICAM_DIR = process.cwd()

const commands = {
  start: `touch ${PICAM_DIR}/hooks/start_record`,
  stop: `touch ${PICAM_DIR}/hooks/stop_record`,
}

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
    AWS.config.update({ region: this.config.region })
    this.picamProcess = null
    this.segmentId = 0
    this.filename = ''
    this.recording = false
    this.canRecord = false
    process.on('exit', this.stop.bind(this))
  }

  // start picam
  start() {
    const filesToRemove = ['hooks', 'rec', 'state'].map((name) => `${PICAM_DIR}/${name}`).join(' ')
    this.picamProcess = exec(`rm ${filesToRemove}`)
    this.picamProcess = exec(`${PICAM_DIR}/picam --alsadev hw:1,0`)

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
      this.recording = true
      this.doSegment()
    } else if (!on && this.recording) {
      this.recording = false
      clearTimeout(this.segmentId)
      exec(commands.stop)
    }
  }

  doSegment() {
    exec(commands.start)
    this.segmentId = setTimeout(() => {
      exec(commands.stop)
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
    }
  }

  async saveChunk(filename) {
    await wait(1000)
    await s3
      .putObject({
        Key: `${this.config.keyPrefix}${filename}`,
        Bucket: this.config.bucket,
        Body: fs.readFileSync(`${PICAM_DIR}/rec/archive/${filename}`),
        ContentType: 'video/mp2t',
      })
      .promise()
    exec(`rm ${PICAM_DIR}/rec/archive/${filename}`)
  }
}

module.exports = PiCam
