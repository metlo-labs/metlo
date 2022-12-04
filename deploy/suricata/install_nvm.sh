#!/bin/bash -e
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
echo "Installing node and yarn"
source /home/$WHOAMI/.nvm/nvm.sh
nvm install 17.9.1
nvm use 17.9.1
npm install -g yarn