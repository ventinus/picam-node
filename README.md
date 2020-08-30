# BodyCam
This package wraps the PiCam library api in node and backs up the video in segments to S3

## Setup
To backup the files to S3, you will need to have aws credentials available under your default profile
- setup Raspberry Pi with a push button on GPIO 4 and an LED on GPIO 17
- `./install_picam.sh`
- `npm install`
- modify the config values in `./src/index.js`
- `npm start`

## Progress

### Next steps
- start script on boot
- hook up with external battery
- assemble physical components to something wearable
- support more/all command line args in config

### Completed steps
- upload stream files to S3
- add button to trigger starting and stopping recording
- add external LED for recording status (stopping and starting for short segments causes the built-in light on the camera to blink)

### Open questions
- possible to use the video stream directly to write a continuous file to s3 instead of 10s segments?
- another way to hook into internet without using cell phone?
