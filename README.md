# BodyCam
This package wraps the PiCam library api in node and backs

### Next steps
- start picam process on boot
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
