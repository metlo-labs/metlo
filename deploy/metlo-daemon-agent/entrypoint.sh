#!/bin/bash
set -e

if [[ -z "$METLO_LISTEN_INTERFACE" ]]; then    
    echo "Placing packet capture on interface $INTERFACE"
    echo "starting metlo daemon"
    sudo /app/metlo-pcap -k $METLO_KEY -u $METLO_HOST
    echo $?
else
    echo "Metlo interface PROVIDED ${METLO_LISTEN_INTERFACE}"
    echo $METLO_LISTEN_INTERFACE
    echo "starting suricata"
    sudo /app/metlo-pcap -i $METLO_LISTEN_INTERFACE -k $METLO_KEY -u $METLO_HOST
fi