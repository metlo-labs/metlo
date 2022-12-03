#!/usr/bin/env bash

sudo apt update -y
sudo apt install software-properties-common -y

HOME_PATH=/home/$WHOAMI

export NVM_DIR=$HOME_PATH/.nvm;
source $NVM_DIR/nvm.sh;


sudo apt-get install wget git -y

echo "CREATING DIRECTORIES"
sudo mkdir -p /etc/suricata-logs
sudo mkdir -p /var/lib/suricata
sudo mkdir -p /var/lib/suricata/rules
sudo mkdir -p /usr/local/nvm
sudo mkdir -p /etc/metlo-ingestor

echo "SETTING PERMISSIONS"
sudo chmod 777 /etc/suricata-logs
sudo chmod 777 /etc/metlo-ingestor

sudo rm -rf /etc/metlo-ingestor

echo "INSTALLING SURICATA"
sudo add-apt-repository ppa:oisf/suricata-stable -y
sudo apt satisfy "suricata (<<7.0.0)" -y
sudo systemctl enable suricata.service
sudo systemctl stop suricata.service


echo "Get network interface"
sudo cp suricata/local.rules /var/lib/suricata/rules/local.rules -f
INTERFACE=$(ip link | egrep "ens[0-9]*" -o)
[ ! -z "$INTERFACE" ] || INTERFACE=$(ip link | egrep "[0-9]*" -o)
echo "Placing packet capture on interface $INTERFACE"
sed -i "s/%interface/$INTERFACE/" suricata/suricata.yaml
sudo cp suricata/suricata.yaml /etc/suricata/suricata.yaml -f


echo "CLONING INGESTOR"
git clone https://github.com/metlo-labs/metlo.git /etc/metlo-ingestor

yarn --cwd /etc/metlo-ingestor/ingestors/suricata install
yarn --cwd /etc/metlo-ingestor/ingestors/suricata build

cd ~
# Use ~ as separator since HOME can have escapable characters which will conflict with forward-slash
# Replace home directory to properly set nvm directory
sed -i "s~%home~$HOME_PATH~" suricata/metlo-ingestor.service

echo "ADDING SERVICE"
sudo mv suricata/metlo-ingestor.service /lib/systemd/system/metlo-ingestor.service -f

echo "STARTING SERVICES"
sudo systemctl daemon-reload
sudo systemctl enable metlo-ingestor.service
sudo systemctl start metlo-ingestor.service
sudo systemctl start suricata.service