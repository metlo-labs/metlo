#include "structs.h"

unsigned char Metlo_block_trace(Metlo_ExchangeStruct data);
void Metlo_ingest_trace(Metlo_ApiTrace trace);
void Metlo_process_trace();
unsigned char Metlo_startup(
    char *metlo_url,
    char *api_key,
    unsigned short backend_port,
    unsigned short collector_port,
    char *log_level,
    char *encryption_key);
