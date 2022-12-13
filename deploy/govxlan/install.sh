#!/bin/bash -e

echo "ADDING METLO USER"
sudo useradd -m metlo
sudo usermod -aG sudo metlo
echo "metlo:metlo" | sudo chpasswd
export WHOAMI=metlo

echo "GETTING FILES"
mkdir -p /home/$WHOAMI/metlo
sudo curl -L https://github.com/metlo-labs/metlo/releases/download/v0.0.3/metlo_0.0.3_linux_amd64.tar.gz > /home/$WHOAMI/metlo.tar.gz
sudo curl -L https://raw.githubusercontent.com/metlo-labs/metlo/master/deploy/govxlan/metlo-traffic-mirror.service > /home/$WHOAMI/metlo/metlo-traffic-mirror.service
sudo tar -xf /home/$WHOAMI/metlo.tar.gz -C /home/$WHOAMI/metlo
sudo cp /home/$WHOAMI/metlo/metlo-pcap /usr/local/bin
sudo chmod +x /usr/local/bin/metlo-pcap

INTERFACE=$(ip link | egrep "ens[0-9]*" -o)
[ ! -z "$INTERFACE" ] || INTERFACE=$(ip link | egrep "eth[0-9]*" -o)
echo "Placing packet capture on interface $INTERFACE"
echo "INTERFACE=$INTERFACE" | sudo tee -a /opt/metlo/credentials

echo "ADDING SERVICE"
echo "metlo" | sudo mv /home/$WHOAMI/metlo/metlo-traffic-mirror.service /lib/systemd/system/metlo-traffic-mirror.service -f

echo "STARTING SERVICES"
echo "metlo" | sudo systemctl daemon-reload
echo "metlo" | sudo systemctl enable metlo-traffic-mirror.service
echo "metlo" | sudo systemctl start metlo-traffic-mirror.service