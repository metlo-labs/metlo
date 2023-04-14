#!/bin/bash -e

export WHOAMI=metlo

echo "UPDATING"
sudo curl -L https://github.com/metlo-labs/metlo/releases/download/v0.1.1/metlo_traffic_mirror_linux_amd64.tar.gz > /home/$WHOAMI/metlo.tar.gz
sudo curl -L https://raw.githubusercontent.com/metlo-labs/metlo/master/deploy/govxlan/metlo-traffic-mirror.service > /home/$WHOAMI/metlo/metlo-traffic-mirror.service
sudo curl -L https://raw.githubusercontent.com/metlo-labs/metlo/master/deploy/govxlan/metlo-traffic-mirror-analyzer.service > /home/$WHOAMI/metlo/metlo-traffic-mirror-analyzer.service
sudo tar -xf /home/$WHOAMI/metlo.tar.gz -C /home/$WHOAMI/metlo
sudo cp /home/$WHOAMI/metlo/metlo-pcap /usr/local/bin
sudo cp /home/$WHOAMI/metlo/metlo-agent /usr/local/bin
sudo mv /home/$WHOAMI/metlo/metlo-traffic-mirror.service /lib/systemd/system/metlo-traffic-mirror.service -f
sudo mv /home/$WHOAMI/metlo/metlo-traffic-mirror-analyzer.service /lib/systemd/system/metlo-traffic-mirror-analyzer.service -f
sudo chmod +x /usr/local/bin/metlo-pcap
sudo chmod +x /usr/local/bin/metlo-agent
