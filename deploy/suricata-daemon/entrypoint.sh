#!/usr/bin/env sh
# Suricata entrypoint script
echo "STARTING"

set -e

# INTERFACE=$(ip link | grep -w -P -o "eth.*(?=:)" | awk "NR==1{print $1}")
# TODO : grep this from interfaces. Ignore part after @
INTERFACE="eth0"

sed -i "s/\${INTERFACE}/eth0/g" /etc/suricata/suricata.yaml

echo "starting metlo"
node /etc/metlo-ingestor/ingestors/suricata/dist/index.js -s /etc/suricata-logs/eve.sock -u $METLO_ADDR -k $METLO_KEY &
sleep 1s
METLO_PID=$(ps aux | grep -w "METLO" | awk '{print $2}' | sort -n | awk "NR==1{print $1}" )

echo "starting suricata"
/usr/bin/suricata -D --pidfile /var/run/suricata.pid -c /etc/suricata/suricata.yaml -i $INTERFACE
sleep 1s

echo "running loop"
while :
do 
  
  TEMP_METLO_PID=$( ps aux | grep -w "METLO" | awk '{print $2}'| sort -n | awk "NR==1{print $1}" )  
  if test -f /var/run/suricata.pid
  then
    :
  else
    echo "SURICATA EXITED. Exiting"
    exit 1
  fi
  
  if [ $METLO_PID != $TEMP_METLO_PID ]
  then    
    echo "METLO INGESTOR EXITED. Exiting"
    exit 1
  fi
  sleep 1  
  cat /etc/suricata-logs/suricata.log
done
