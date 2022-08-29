echo "INSTALL NODE AND YARN"
source $HOME/.nvm/nvm.sh
nvm install 17.9.1
nvm use 17.9.1
npm install -g yarn

cd /etc/metlo-ingestor/ingestors/suricata
yarn install
yarn build

echo "ADDING SERVICE"
sudo mv ~/metlo-ingestor.service /lib/systemd/system/metlo-ingestor.service -f

echo "STARTING SERVICES"
sudo systemctl daemon-reload
sudo systemctl enable metlo-ingestor.service
sudo systemctl start metlo-ingestor.service
sudo systemctl start suricata.service
