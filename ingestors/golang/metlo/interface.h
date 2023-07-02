typedef struct
{
    char *Name;
    char *Value;
} Metlo_NVPair;

typedef struct
{
    /*
     * pub host: String,
     * pub path: String,
     * pub parameters: Vec<KeyVal>,
     **/
    char *Host;
    char *Path;
    Metlo_NVPair *Parameters;
    unsigned int Parameters_size;
} Metlo_ApiUrl;

typedef struct
{
    /**
     * pub method: String,
     * pub url: ApiUrl,
     * pub headers: Vec<KeyVal>,
     * pub body: String,
     * pub user: Option<String>,
     **/
    char *Method;
    Metlo_ApiUrl Url;
    Metlo_NVPair *Headers;
    unsigned int Headers_size;
    char *Body;
} Metlo_Request;

typedef struct
{
    /**
     * pub status: u16,
     * pub headers: Vec<KeyVal>,
     * pub body: String,
     **/
    unsigned short Status;
    Metlo_NVPair *Headers;
    unsigned int Headers_size;
    char *Body;
} Metlo_Response;

typedef struct
{
    /*
     * pub environment: String,
     * pub incoming: bool,
     * pub source: String,
     * pub source_port: u16,
     * pub destination: String,
     * pub destination_port: u16,
     * pub original_source: Option<String>,
     **/
    char *Environment; // Always production
    int Incoming;
    char *Source;
    unsigned short Source_port;
    char *Destination;
    unsigned short Destination_port;
} Metlo_Metadata;

typedef struct
{
    Metlo_Request Req;
    Metlo_Metadata Meta;
} Metlo_ExchangeStruct;

typedef struct
{
    Metlo_Request Req;
    Metlo_Response Res;
    Metlo_Metadata Meta;
} Metlo_ApiTrace;

extern unsigned char Metlo_block_trace(Metlo_ExchangeStruct data);
extern void Metlo_ingest_trace(Metlo_ApiTrace trace);
extern void Metlo_process_trace();
extern unsigned char Metlo_startup(
    char *metlo_url,
    char *api_key,
    unsigned short backend_port,
    unsigned short collector_port,
    char *log_level,
    char *encryption_key);
