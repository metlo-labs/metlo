#!/usr/bin/env bash

command_present() {
  type "$1" >/dev/null 2>&1
}

if ! command_present wget && command_present yum; then
  sudo yum install wget
fi

if ! command_present docker; then
  wget -qO- https://get.docker.com/ | sh
fi
if ! command_present docker-compose; then
  sudo -E curl -L https://github.com/docker/compose/releases/download/1.29.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi
sudo docker service start

sudo mkdir /opt/metlo 
sudo wget https://raw.githubusercontent.com/metlo-labs/metlo/test-old-python-azure/manage-deployment.py -O /opt/metlo/manage-deployment.py
sudo chmod +x /opt/metlo/manage-deployment.py

sudo ln -s /opt/metlo/manage-deployment.py /usr/bin/metlo-deploy

export METLO_DIR=/opt/metlo
sudo metlo-deploy init
sudo metlo-deploy update
