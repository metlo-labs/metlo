package com.metlo.spring;

import com.google.gson.Gson;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.SynchronousQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

public class Metlo extends OncePerRequestFilter {
    private static final int DEFAULT_THREAD_POOL_SIZE = 8;
    private final static String endpoint = "/api/v1/log-request/single";
    private final ThreadPoolExecutor pool;
    private final String METLO_KEY;
    private final String METLO_ADDR;

    public Metlo(String host, String api_key) {
        this(DEFAULT_THREAD_POOL_SIZE, host, api_key);
    }

    public Metlo(int pool_size, String host, String api_key) {
        this.METLO_KEY = api_key;
        this.METLO_ADDR = host + Metlo.endpoint;
        this.pool = new ThreadPoolExecutor(0, pool_size,
                60L, TimeUnit.SECONDS,
                new SynchronousQueue<Runnable>());
    }

    private void pushRequest(Map<String, Object> data) throws IOException {
        URL url = new URL(this.METLO_ADDR);
        URLConnection con = url.openConnection();
        HttpURLConnection http = (HttpURLConnection) con;
        http.setRequestMethod("POST"); // PUT is another valid option
        http.setRequestProperty("Authorization", this.METLO_KEY);
        http.setDoOutput(true);
        Gson gson = new Gson();
        String json = gson.toJson(data);

        byte[] out = json.getBytes(StandardCharsets.UTF_8);
        int length = out.length;

        http.setFixedLengthStreamingMode(length);
        http.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        http.connect();
        try (OutputStream os = http.getOutputStream()) {
            os.write(out);
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);

        filterChain.doFilter(requestWrapper, responseWrapper);

        String requestBody = getStringValue(requestWrapper.getContentAsByteArray(),
                request.getCharacterEncoding());
        String responseBody = getStringValue(responseWrapper.getContentAsByteArray(),
                response.getCharacterEncoding());

        this.pool.submit(() -> {
            try {
                this.pushRequest(createDataBinding(requestWrapper, responseWrapper, requestBody, responseBody));
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
        responseWrapper.copyBodyToResponse();
    }

    private String getStringValue(byte[] contentAsByteArray, String characterEncoding) {
        try {
            return new String(contentAsByteArray, 0, contentAsByteArray.length, characterEncoding);
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return "";
    }

    private Map<String, Object> createDataBinding(HttpServletRequest request, HttpServletResponse response, String request_body, String response_body) throws Exception {
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
            entry.put("Name", entry_raw.getKey());
            entry.put("Value", "[" + String.join(",", entry_raw.getValue()) + "]");
            _formatted_params_.add(entry);
        }
        return _formatted_params_;
    }

    private List<Map<String, String>> listRequestHeaderFormat(Enumeration<String> headerNames, Function<String, String> headerValueForName) throws Exception {
        List<Map<String, String>> headers = new ArrayList<Map<String, String>>();
        for (Iterator<String> headerNameIter = headerNames.asIterator(); headerNameIter.hasNext(); ) {
            String headerName = headerNameIter.next();
            String headerValue = headerValueForName.apply(headerName);
            Map<String, String> individualHeader = new HashMap<String, String>();
            individualHeader.put("Name", headerName);
            individualHeader.put("Value", headerValue);
            headers.add(individualHeader);
        }
        return headers;
    }

    private List<Map<String, String>> listResponseHeaderFormat(Collection<String> headerNames, Function<String, String> headerValueForName) throws Exception {
        List<Map<String, String>> headers = new ArrayList<Map<String, String>>();
        for (String headerName : headerNames) {
            String headerValue = headerValueForName.apply(headerName);
            Map<String, String> individualHeader = new HashMap<String, String>();
            individualHeader.put("Name", headerName);
            individualHeader.put("Value", headerValue);
            headers.add(individualHeader);
        }
        return headers;
    }

}
