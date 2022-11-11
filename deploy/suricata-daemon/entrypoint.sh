#!/bin/bash
set -e

# Suricata entrypoint script
echo "STARTING"


# INTERFACE=$(ip link | grep -w -P -o "eth.*(?=:)" | awk "NR==1{print $1}")
# TODO : grep this from interfaces. Ignore part after @

if [[ -z "$METLO_LISTEN_INTERFACE" ]]; then
    echo "Metlo interface NOT PROVIDED" 
    echo "Defaulting to interface eth0"
    sed -i "s/\${INTERFACE}/eth0/g" /etc/suricata/suricata.yaml
    echo $INTERFACE
    echo "starting suricata"
    /usr/bin/suricata --pidfile /var/run/suricata.pid -c /etc/suricata/suricata.yaml -i eth0 &    
else
    echo "Metlo interface PROVIDED ${METLO_LISTEN_INTERFACE}"
    sed -i "s/\${INTERFACE}/${INTERFACE}/g" /etc/suricata/suricata.yaml
    echo $METLO_LISTEN_INTERFACE
    echo "starting suricata"
    /usr/bin/suricata --pidfile /var/run/suricata.pid -c /etc/suricata/suricata.yaml -i $METLO_LISTEN_INTERFACE &
fi

echo "starting metlo"
node /etc/metlo-ingestor/ingestors/suricata/dist/index.js -s /tmp/eve.sock -u $METLO_ADDR -k $METLO_KEY &

wait -n