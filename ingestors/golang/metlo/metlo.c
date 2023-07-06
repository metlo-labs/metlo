#include <dlfcn.h>
#include <stdio.h>

#include "go_interface.h"

bool hasInit = 0;
void *handle;
unsigned char (*metlo_startup)(char *metlo_url,
                               char *api_key,
                               unsigned short backend_port,
                               unsigned short collector_port,
                               char *log_level,
                               char *encryption_key);
unsigned char (*metlo_block_trace)(Metlo_ExchangeStruct data);
void (*metlo_ingest_trace)(Metlo_ApiTrace trace);

unsigned char Metlo_startup(
    char *metlo_url,
    char *api_key,
    unsigned short backend_port,
    unsigned short collector_port,
    char *log_level,
    char *encryption_key)
{
    handle = dlopen("/Users/ninadsinha/Desktop/metlo-enterprise/ingestors/golang/rust_binds/target/release/libmetlo_golang.dylib", RTLD_LAZY);
    if (handle != 0)
    {
        metlo_startup = (unsigned char (*)(char *metlo_url,
                                           char *api_key,
                                           unsigned short backend_port,
                                           unsigned short collector_port,
                                           char *log_level,
                                           char *encryption_key))dlsym(handle, "metlo_startup");
        if (metlo_startup == 0)
        {
            printf("Error setting up metlo_startup: %s", dlerror());
            hasInit = 0;
            return 0;
        }
        metlo_block_trace = (unsigned char (*)(Metlo_ExchangeStruct data))dlsym(handle, "metlo_block_trace");
        if (metlo_startup == 0)
        {
            printf("Error setting up metlo_block_trace: %s", dlerror());
            return 0;
        }
        metlo_ingest_trace = (void (*)(Metlo_ApiTrace data))dlsym(handle, "metlo_ingest_trace");
        if (metlo_startup == 0)
        {
            printf("Error setting up metlo_ingest_trace: %s", dlerror());
            return 0;
        }
        unsigned char resp = metlo_startup(metlo_url, api_key, backend_port, collector_port, log_level, encryption_key);
        hasInit = resp;
        return resp;
    }
    else
    {
        printf("%s", dlerror());
        return 0;
    }
}

unsigned char Metlo_block_trace(Metlo_ExchangeStruct data)
{
    if (hasInit == 1)
    {
        return metlo_block_trace(data);
    }
    else
    {
        return 0;
    }
}

void Metlo_ingest_trace(Metlo_ApiTrace trace)
{
    if (hasInit == 1)
    {
        metlo_ingest_trace(trace);
    }
}

void handle_cleanup(void)
{
    if (handle != 0)
    {
        dlclose(handle);
    }
}
