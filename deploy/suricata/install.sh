#!/bin/bash -e

sudo useradd -m suricata

export WHOAMI=suricata

sudo mkdir -p /opt/metlo
sudo touch /opt/metlo/credentials

echo 'METLO_ADDR=$METLO_ADDR' >> opt/metlo/credentials
echo 'METLO_KEY=$METLO_KEY' >> opt/metlo/credentials

mkdir -p suricata
cd suricata

sudo apt update -y
sudo apt install wget -y

sudo wget https://raw.githubusercontent.com/metlo-labs/metlo/mirror_install_script/deploy/suricata/install.sh
sudo wget https://raw.githubusercontent.com/metlo-labs/metlo/mirror_install_script/deploy/suricata/install_deps.sh
sudo wget https://raw.githubusercontent.com/metlo-labs/metlo/mirror_install_script/deploy/suricata/install_nvm.sh
sudo wget https://raw.githubusercontent.com/metlo-labs/metlo/mirror_install_script/deploy/suricata/local.rules
sudo wget https://raw.githubusercontent.com/metlo-labs/metlo/mirror_install_script/deploy/suricata/metlo-ingestor.service
sudo wget https://raw.githubusercontent.com/metlo-labs/metlo/mirror_install_script/deploy/suricata/suricata.yaml

chmod +x suricata/install_nvm.sh
chmod +x suricata/install_deps.sh

sudo -E suricata/install_nvm.sh
echo $PATH
sudo PATH=$PATH -E suricata/install_deps.sh