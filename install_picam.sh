#!/bin/bash

# Install picam binary
wget https://github.com/iizukanao/picam/releases/download/v1.4.9/picam-1.4.9-binary.tar.xz
tar xvf picam-1.4.9-binary.tar.xz
cp picam-1.4.9-binary/picam $DEST_DIR
rm -rf picam-1.4.9-*
