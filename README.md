# BodyCam
This package wraps the PiCam library api in node and backs

### Next steps
- add xstate to manage:
  - add button to trigger starting and stopping recording
  - add external LED for recording status (stopping and starting for short segments causes the built-in light on the camera to blink)
- start picam process on boot
- hook up with external battery
- assemble physical components to something wearable
- support more/all command line args in config
- another way to hook into internet without using cell phone?

### Completed steps
- upload stream files to S3

### Open questions
- possible to use the video stream directly to write a continuous file to s3 instead of 10s segments?
