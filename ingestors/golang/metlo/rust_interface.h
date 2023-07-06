#include "structs.h"

extern unsigned char metlo_block_trace(Metlo_ExchangeStruct data);
extern void metlo_ingest_trace(Metlo_ApiTrace trace);
extern void metlo_process_trace();
extern unsigned char metlo_startup(
    char *metlo_url,
    char *api_key,
    unsigned short backend_port,
    unsigned short collector_port,
    char *log_level,
    char *encryption_key);
