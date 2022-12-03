#!/bin/bash -e
export WHOAMI=$(whoami)
chmod +x suricata/install_nvm.sh
chmod +x suricata/install_deps.sh

sudo -E suricata/install_nvm.sh
echo $PATH
sudo PATH=$PATH -E suricata/install_deps.sh