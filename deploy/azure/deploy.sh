#!/bin/bash
mkdir /opt/metlo
touch /opt/metlo/credentials
echo "METLO_ADDR=<METLO_ADDRESS>:8081" >> /opt/metlo/credentials
echo "METLO_KEY=<METLO_KEY>" >>  /opt/metlo/credentials