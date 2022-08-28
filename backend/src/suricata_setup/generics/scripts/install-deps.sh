curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

echo "INSTALLING SURICATA"
sudo add-apt-repository ppa:oisf/suricata-stable -y
sudo apt install suricata -y
sudo systemctl enable suricata.service
sudo systemctl stop suricata.service
sudo mkdir /etc/suricata-logs
sudo chmod 777 /etc/suricata-logs

sudo mkdir /var/lib/suricata
sudo mkdir /var/lib/suricata/rules
sudo mv ~/local.rules /var/lib/suricata/rules/local.rules -f

sudo mv ~/suricata.yaml /etc/suricata/suricata.yaml -f

sudo mkdir /usr/local/nvm
sudo mkdir /etc/metlo-ingestor

echo "CLONING INGESTOR"
cd /etc
sudo chmod 777 /etc/metlo-ingestor
git clone https://github.com/metlo-labs/metlo.git metlo-ingestor