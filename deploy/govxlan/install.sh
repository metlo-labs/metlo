#!/bin/bash -e

echo "ADDING METLO USER"
sudo useradd -m metlo
sudo usermod -aG sudo metlo
echo "metlo:metlo" | sudo chpasswd
export WHOAMI=metlo

echo "GETTING FILES"
mkdir -p /home/$WHOAMI/metlo
sudo curl -L https://github.com/metlo-labs/metlo/releases/download/v0.0.6/metlo_traffic_mirror_linux_amd64.tar.gz > /home/$WHOAMI/metlo.tar.gz
sudo curl -L https://raw.githubusercontent.com/metlo-labs/metlo/master/deploy/govxlan/metlo-traffic-mirror.service > /home/$WHOAMI/metlo/metlo-traffic-mirror.service
sudo curl -L https://raw.githubusercontent.com/metlo-labs/metlo/master/deploy/govxlan/metlo-traffic-mirror-analyzer.service > /home/$WHOAMI/metlo/metlo-traffic-mirror-analyzer.service
sudo tar -xf /home/$WHOAMI/metlo.tar.gz -C /home/$WHOAMI/metlo
sudo cp /home/$WHOAMI/metlo/metlo-pcap /usr/local/bin
sudo cp /home/$WHOAMI/metlo/metlo-agent /usr/local/bin
sudo chmod +x /usr/local/bin/metlo-pcap
sudo chmod +x /usr/local/bin/metlo-agent

INTERFACE=$(ip link | egrep "ens[0-9]*" -o -m 1 || true)
[ ! -z "$INTERFACE" ] || INTERFACE=$(ip link | egrep "eth[0-9]*" -o -m 1 || true)
echo "Placing packet capture on interface $INTERFACE"
echo "INTERFACE=$INTERFACE" | sudo tee -a /opt/metlo/credentials

echo "ADDING SERVICES"
echo "metlo" | sudo mv /home/$WHOAMI/metlo/metlo-traffic-mirror.service /lib/systemd/system/metlo-traffic-mirror.service -f
echo "metlo" | sudo mv /home/$WHOAMI/metlo/metlo-traffic-mirror-analyzer.service /lib/systemd/system/metlo-traffic-mirror-analyzer.service -f

echo "STARTING SERVICES"
echo "metlo" | sudo systemctl daemon-reload
echo "metlo" | sudo systemctl enable metlo-traffic-mirror.service
echo "metlo" | sudo systemctl start metlo-traffic-mirror.service
echo "metlo" | sudo systemctl enable metlo-traffic-mirror-analyzer.service
echo "metlo" | sudo systemctl start metlo-traffic-mirror-analyzer.service
