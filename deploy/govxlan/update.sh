#!/bin/bash -e

export WHOAMI=metlo

echo "UPDATING"
sudo curl -L https://github.com/metlo-labs/metlo/releases/download/v0.0.4/metlo_0.0.4_linux_amd64.tar.gz > /home/$WHOAMI/metlo.tar.gz
sudo tar -xf /home/$WHOAMI/metlo.tar.gz -C /home/$WHOAMI/metlo
sudo cp /home/$WHOAMI/metlo/metlo-pcap /usr/local/bin
sudo chmod +x /usr/local/bin/metlo-pcap
