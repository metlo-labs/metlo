sudo add-apt-repository ppa:oisf/suricata-stable -y
sudo apt install suricata -y
sudo systemctl enable suricata.service
sudo systemctl stop suricata.service
mkdir /etc/suricata-logs
chmod 777 /etc/suricata-logs

mkdir /var/lib/suricata/rules
mv ~/local.rules /var/lib/suricata/rules/local.rules

mv ~/suricata.yaml /etc/suricata/suricata.yaml

mkdir /usr/local/nvm

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

export NVM_DIR=/usr/local/nvm
export NPM_CONFIG_PREFIX=/usr/local/node
export PATH="/usr/local/node/bin:$PATH"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

nvm install 17
nvm use 17
npm install -g yarn

cd /etc
git clone https://github.com/metlo-labs/metlo.git metlo-ingestor
cd metlo-ingestor/ingestors/suricata
yarn build

sudo mv ~/metlo-ingestor.service /lib/systemd/system/metlo-ingestor.service