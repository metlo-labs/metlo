#!/bin/bash

/app/metlo-agent &
/app/metlo-pcap &
  
# Wait for any process to exit
wait -n
  
# Exit with status of process that exited first
exit $?