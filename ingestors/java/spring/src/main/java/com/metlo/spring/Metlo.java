package com.metlo.spring;

import com.metlo.spring.utils.ContentCachingResponseWrapperWithHeaderNames;
import com.metlo.spring.utils.PingHome;
import com.metlo.spring.utils.RateLimitingRequests;

// Should be supported in every version 2003+
import org.springframework.web.filter.OncePerRequestFilter;
// Min spring version 4.1.3, Java Version 8
import org.springframework.web.util.ContentCachingRequestWrapper;

// Min Servlet 2.3
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.*;
import java.util.function.Function;
import java.util.logging.Logger;


public class Metlo extends OncePerRequestFilter {
    private static final int DEFAULT_THREAD_POOL_SIZE = 2;

    private static final int DEFAULT_RPS = 10;
    private final static String endpoint_log_single = "api/v1/log-request/single";
    private final static String endpoint_ping = "api/v1/verify";

    private final static Logger LOGGER =
            Logger.getLogger("com.metlo.spring");

    private final Boolean enabled;

    private final RateLimitingRequests req;

    public Metlo(String host, String api_key) {
        this(DEFAULT_THREAD_POOL_SIZE, host, api_key, DEFAULT_RPS);
    }

    public Metlo(String host, String api_key, Integer rps) {
        this(DEFAULT_THREAD_POOL_SIZE, host, api_key, rps);
    }

    public Metlo(int pool_size, String host, String api_key, Integer rps) {
        Boolean enabledTemp;
        String METLO_ADDR = host;
        String METLO_PING_HOME = host;
        if (host.charAt(host.length() - 1) == '/') {
            METLO_ADDR += endpoint_log_single;
            METLO_PING_HOME += endpoint_ping;
        } else {
            METLO_ADDR += "/" + endpoint_log_single;
            METLO_PING_HOME += "/" + endpoint_ping;
        }
        this.req = new RateLimitingRequests(rps, pool_size, METLO_ADDR, api_key);

        String enabled = System.getenv("METLO_ENABLED");
        if (enabled != null) {
            enabledTemp = Boolean.parseBoolean(enabled);
        } else {
            enabledTemp = true;
        }

        if (enabledTemp) {
            try {
                enabledTemp = new PingHome(METLO_PING_HOME, api_key, LOGGER).ping();
                if (!enabledTemp) {
                    LOGGER.warning("Due to previous error, Metlo has been disabled");
                }
            } catch (IOException e) {
                LOGGER.warning("Could not connect to Metlo. Encountered error: " + e.getMessage());
                LOGGER.warning("Due to previous error, Metlo has been disabled");
                enabledTemp = false;
            }
        }
        this.enabled = enabledTemp;
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapperWithHeaderNames responseWrapper = new ContentCachingResponseWrapperWithHeaderNames(response);

        filterChain.doFilter(requestWrapper, responseWrapper);
        if (this.enabled) {
            String requestBody = getStringValue(requestWrapper.getContentAsByteArray(),
                    request.getCharacterEncoding());
            String responseBody = getStringValue(responseWrapper.getContentAsByteArray(),
                    response.getCharacterEncoding());

            this.req.send(createDataBinding(requestWrapper, responseWrapper, requestBody, responseBody));
            // copyBodyToResponse requires min Spring 4.2.0
            responseWrapper.copyBodyToResponse();
        }
    }

    private String getStringValue(byte[] contentAsByteArray, String characterEncoding) {
        try {
            return new String(contentAsByteArray, 0, contentAsByteArray.length, characterEncoding);
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return "";
    }

    private Map<String, Object> createDataBinding(HttpServletRequest request, ContentCachingResponseWrapperWithHeaderNames response, String request_body, String response_body) {
        Map<String, Object> DATA = new HashMap<String, Object>();
        Map<String, Object> REQUEST = new HashMap<>();
        Map<String, Object> REQUEST_URL = new HashMap<>();
        Map<String, Object> RESPONSE = new HashMap<>();
        Map<String, Object> META = new HashMap<>();

        String host = request.getHeader("host");
        if (host == null) {
            host = request.getRemoteHost();
        }
        REQUEST_URL.put("host", host);
        REQUEST_URL.put("path", request.getRequestURI());
        REQUEST_URL.put("parameters", listParamFormat(request.getParameterMap()));

        REQUEST.put("url", REQUEST_URL);
        try {
            REQUEST.put("headers", listRequestHeaderFormat(request.getHeaderNames(), request::getHeader));
        } catch (Exception e) {
            REQUEST.put("headers", new ArrayList<Map<String, String>>());
        }
        REQUEST.put("body", request_body);
        REQUEST.put("method", request.getMethod());

        RESPONSE.put("url", request.getLocalAddr());
        RESPONSE.put("status", response.getStatus());
        try {
            RESPONSE.put("headers", listResponseHeaderFormat(response.getHeaderNames(), response::getHeader));
        } catch (Exception e) {
            RESPONSE.put("headers", new ArrayList<Map<String, String>>());
        }
        boolean foundContentType = false;
        for (Map<String, String> header : (ArrayList<Map<String, String>>) RESPONSE.get("headers")) {
            if (header.get("name").equals("Content-Type")) {
                header.put("value", response.getResponse().getContentType());
                foundContentType = true;
                break;
            }
        }
        if (!foundContentType) {
            Map<String, String> entry = new HashMap<String, String>();
            entry.put("name", "Content-Type");
            entry.put("value", response.getResponse().getContentType());
            ((ArrayList<Map<String, String>>) RESPONSE.get("headers")).add(entry);
        }


        RESPONSE.put("body", response_body);

        META.put("source", request.getRemoteAddr());
        META.put("sourcePort", request.getRemotePort());
        META.put("destination", request.getLocalAddr());
        META.put("destinationPort", request.getLocalPort());
        META.put("environment", "production");
        META.put("incoming", "true");
        META.put("metloSource", "java/spring");

        DATA.put("request", REQUEST);
        DATA.put("response", RESPONSE);
        DATA.put("meta", META);

        return DATA;
    }

    private List<Map<String, String>> listParamFormat(Map<String, String[]> map) {
        List<Map<String, String>> _formatted_params_ = new ArrayList<>();
        for (Map.Entry<String, String[]> entry_raw : map.entrySet()) {
            HashMap<String, String> entry = new HashMap<String, String>();
            entry.put("name", entry_raw.getKey());
            entry.put("value", "[" + String.join(",", entry_raw.getValue()) + "]");
            _formatted_params_.add(entry);
        }
        return _formatted_params_;
    }

    private List<Map<String, String>> listRequestHeaderFormat(Enumeration<String> headerNames, Function<String, String> headerValueForName) throws Exception {
        List<Map<String, String>> headers = new ArrayList<Map<String, String>>();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            String headerValue = headerValueForName.apply(headerName);
            Map<String, String> individualHeader = new HashMap<String, String>();
            individualHeader.put("name", headerName);
            individualHeader.put("value", headerValue);
            headers.add(individualHeader);
        }
        return headers;
    }

    private List<Map<String, String>> listResponseHeaderFormat(Collection<String> headerNames, Function<String, String> headerValueForName) throws Exception {
        List<Map<String, String>> headers = new ArrayList<Map<String, String>>();
        for (String headerName : headerNames) {
            String headerValue = headerValueForName.apply(headerName);
            Map<String, String> individualHeader = new HashMap<String, String>();
            individualHeader.put("name", headerName);
            individualHeader.put("value", headerValue);
            headers.add(individualHeader);
        }
        return headers;
    }

}
