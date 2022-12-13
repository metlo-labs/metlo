#!/usr/bin/env bash

echo "suricata" | sudo  apt update -y
echo "suricata" | sudo  apt install software-properties-common -y

HOME_PATH=/home/$WHOAMI

export NVM_DIR=$HOME_PATH/.nvm;
source $NVM_DIR/nvm.sh;


echo "suricata" | sudo  apt-get install wget git -y

echo "CREATING DIRECTORIES"
echo "suricata" | sudo  mkdir -p /etc/suricata-logs
echo "suricata" | sudo  mkdir -p /var/lib/suricata
echo "suricata" | sudo  mkdir -p /var/lib/suricata/rules
echo "suricata" | sudo  mkdir -p /usr/local/nvm
echo "suricata" | sudo  mkdir -p /etc/metlo-ingestor

echo "SETTING PERMISSIONS"
echo "suricata" | sudo  chmod 777 /etc/suricata-logs
echo "suricata" | sudo  chmod 777 /etc/metlo-ingestor

echo "suricata" | sudo  rm -rf /etc/metlo-ingestor

echo "INSTALLING SURICATA"
echo "suricata" | sudo  add-apt-repository ppa:oisf/suricata-stable -y
echo "suricata" | sudo  apt satisfy "suricata (<<7.0.0)" -y
echo "suricata" | sudo  systemctl enable suricata.service
echo "suricata" | sudo  systemctl stop suricata.service


echo "Get network interface"
echo "suricata" | sudo  cp /home/$WHOAMI/suricata/local.rules /var/lib/suricata/rules/local.rules -f
INTERFACE=$(ip link | egrep "ens[0-9]*" -o)
[ ! -z "$INTERFACE" ] || INTERFACE=$(ip link | egrep "[0-9]*" -o)
echo "Placing packet capture on interface $INTERFACE"
sed -i "s/%interface/$INTERFACE/" /home/$WHOAMI/suricata/suricata.yaml
echo "suricata" | sudo  cp /home/$WHOAMI/suricata/suricata.yaml /etc/suricata/suricata.yaml -f


echo "CLONING INGESTOR"
git clone https://github.com/metlo-labs/metlo.git /etc/metlo-ingestor

yarn --cwd /etc/metlo-ingestor/ingestors/suricata install
yarn --cwd /etc/metlo-ingestor/ingestors/suricata build

cd ~
# Use ~ as separator since HOME can have escapable characters which will conflict with forward-slash
# Replace home directory to properly set nvm directory
sed -i "s~%home~$HOME_PATH~" /home/$WHOAMI/suricata/metlo-ingestor.service

echo "ADDING SERVICE"
echo "suricata" | sudo  mv /home/$WHOAMI/suricata/metlo-ingestor.service /lib/systemd/system/metlo-ingestor.service -f

echo "STARTING SERVICES"
echo "suricata" | sudo  systemctl daemon-reload
echo "suricata" | sudo  systemctl enable metlo-ingestor.service
echo "suricata" | sudo  systemctl start metlo-ingestor.service
echo "suricata" | sudo  systemctl start suricata.service