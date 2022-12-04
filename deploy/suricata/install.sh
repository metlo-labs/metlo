#!/bin/bash -e

sudo useradd -m suricata
sudo usermod -aG sudo suricata
echo "suricata:suricata" | sudo chpasswd

export WHOAMI=suricata

echo 'METLO_ADDR=${METLO_ADDR}' >> /opt/metlo/credentials
echo 'METLO_KEY=${METLO_KEY}' >> /opt/metlo/credentials


sudo apt update -y
sudo apt install wget -y

cd /home/$WHOAMI
mkdir -p /home/$WHOAMI/suricata

sudo wget https://raw.githubusercontent.com/metlo-labs/metlo/mirror_install_script/deploy/suricata/install_deps.sh -P /home/$WHOAMI/suricata
sudo wget https://raw.githubusercontent.com/metlo-labs/metlo/mirror_install_script/deploy/suricata/install_nvm.sh -P /home/$WHOAMI/suricata
sudo wget https://raw.githubusercontent.com/metlo-labs/metlo/mirror_install_script/deploy/suricata/local.rules -P /home/$WHOAMI/suricata
sudo wget https://raw.githubusercontent.com/metlo-labs/metlo/mirror_install_script/deploy/suricata/metlo-ingestor.service -P /home/$WHOAMI/suricata
sudo wget https://raw.githubusercontent.com/metlo-labs/metlo/mirror_install_script/deploy/suricata/suricata.yaml -P /home/$WHOAMI/suricata

chmod +x /home/$WHOAMI/suricata/install_nvm.sh
chmod +x /home/$WHOAMI/suricata/install_deps.sh

sudo WHOAMI=$WHOAMI -i -u $WHOAMI /home/$WHOAMI/suricata/install_nvm.sh
sudo PATH=$PATH WHOAMI=$WHOAMI /home/$WHOAMI/suricata/install_deps.sh