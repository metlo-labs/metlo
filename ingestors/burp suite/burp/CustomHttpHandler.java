package burp;


import burp.api.montoya.http.HttpService;
import burp.api.montoya.http.handler.*;
import burp.api.montoya.http.message.params.ParsedHttpParameter;
import burp.api.montoya.http.message.HttpHeader;
import burp.metlo.RateLimitedRequests;


import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CustomHttpHandler implements HttpHandler {
    private final TableModel tableModel;
    private final burp.api.montoya.logging.Logging logger;

    private final RateLimitedRequests requests;

    public CustomHttpHandler(TableModel tableModel, burp.api.montoya.logging.Logging logger) {

        this.tableModel = tableModel;
        this.logger = logger;
        this.requests = new RateLimitedRequests(
                10,
                4,
                "https://app.metlo.com:8081/api/v1/log-request/single",
                "metlo.aSTedMNFxQijHvw3PHOpzhQEiGzjXhvQHmn2oD4w",
                this.logger
        );
    }

    private Map<String, Object> createDataBinding(HttpResponseReceived response, burp.api.montoya.http.message.requests.HttpRequest request) {
        Map<String, Object> DATA = new HashMap<>();
        Map<String, Object> REQUEST = new HashMap<>();
        Map<String, Object> REQUEST_URL = new HashMap<>();
        Map<String, Object> RESPONSE = new HashMap<>();
        Map<String, Object> META = new HashMap<>();

        HttpService reqHTTPService = request.httpService();

        REQUEST_URL.put("host", reqHTTPService.host());
        REQUEST_URL.put("path", request.path());
        REQUEST_URL.put("parameters", this.ParsedHTTPParamToMap(request.parameters()));

        REQUEST.put("url", REQUEST_URL);
        try {
            REQUEST.put("headers", this.headersToMap(request.headers()));
        } catch (Exception e) {
            REQUEST.put("headers", new ArrayList<Map<String, String>>());
        }
        REQUEST.put("body", request.body().toString());
        REQUEST.put("method", request.method());

        RESPONSE.put("status", response.statusCode());
        try {
            RESPONSE.put("headers", this.headersToMap(response.headers()));
        } catch (Exception e) {
            RESPONSE.put("headers", new ArrayList<Map<String, String>>());
        }

        RESPONSE.put("body", response.body().toString());
        String hostAddress = "0.0.0.0";
        try {
            InetAddress inet = InetAddress.getByName((new URL(request.url())).getHost());
            hostAddress = inet.getHostAddress();
        } catch (UnknownHostException | MalformedURLException e) {
            this.logger.logToError("");
        }

        META.put("source", "127.0.0.1");
        META.put("sourcePort", 0);
        META.put("destination", hostAddress);
        META.put("destinationPort", reqHTTPService.port());
        META.put("environment", "production");
        META.put("incoming", "true");
        META.put("metloSource", "burp_suite");

        DATA.put("request", REQUEST);
        DATA.put("response", RESPONSE);
        DATA.put("meta", META);

        return DATA;
    }

    private List<Map<String, String>> ParsedHTTPParamToMap(List<ParsedHttpParameter> params) {
        List<Map<String, String>> _formatted_params_ = new ArrayList<>();
        for (ParsedHttpParameter a : params) {
            Map<String, String> _map = new HashMap<>();
            _map.put("name", URLDecoder.decode(a.name(), StandardCharsets.UTF_8));
            _map.put("value", URLDecoder.decode(a.value(), StandardCharsets.UTF_8));
            _formatted_params_.add(_map);
        }
        return _formatted_params_;
    }

    private List<Map<String, String>> headersToMap(List<HttpHeader> headers) {
        List<Map<String, String>> _formatted_headers_ = new ArrayList<>();
        for (HttpHeader a : headers) {
            Map<String, String> _map = new HashMap<>();
            _map.put("name", URLDecoder.decode(a.name(), StandardCharsets.UTF_8));
            _map.put("value", URLDecoder.decode(a.value(), StandardCharsets.UTF_8));
            _formatted_headers_.add(_map);
        }
        return _formatted_headers_;
    }

    @Override
    public RequestToBeSentAction handleHttpRequestToBeSent(HttpRequestToBeSent requestToBeSent) {
        return RequestToBeSentAction.continueWith(requestToBeSent);
    }

    @Override
    public ResponseReceivedAction handleHttpResponseReceived(HttpResponseReceived responseReceived) {
        tableModel.add(responseReceived);
        this.requests.send(this.createDataBinding(responseReceived, responseReceived.initiatingRequest()));
        return ResponseReceivedAction.continueWith(responseReceived);
    }
}