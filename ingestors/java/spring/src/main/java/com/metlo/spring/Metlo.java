package com.metlo.spring;

import com.google.gson.Gson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

public class Metlo extends OncePerRequestFilter {
    private static final Logger LOGGER = LoggerFactory.getLogger(Metlo.class);
    private static final int DEFAULT_THREAD_POOL_SIZE = 8;
    private final ThreadPoolExecutor pool;
    private final String METLO_KEY;
    private final String METLO_ADDR;

    public Metlo(String host, String api_key) {
        this(DEFAULT_THREAD_POOL_SIZE, host, api_key);
    }

    public Metlo(int pool_size, String host, String api_key) {
        this.METLO_KEY = api_key;
        this.METLO_ADDR = host;
        this.pool = new ThreadPoolExecutor(0, pool_size,
                60L, TimeUnit.SECONDS,
                new SynchronousQueue<Runnable>());
    }

    private void pushRequest(DataBinding data) throws IOException {
        URL url = new URL("https://eoene6b90uzny1h.m.pipedream.net");
        URLConnection con = url.openConnection();
        HttpURLConnection http = (HttpURLConnection) con;
        http.setRequestMethod("POST"); // PUT is another valid option
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

        long startTime = System.currentTimeMillis();
        filterChain.doFilter(requestWrapper, responseWrapper);
        long timeTaken = System.currentTimeMillis() - startTime;

        String requestBody = getStringValue(requestWrapper.getContentAsByteArray(),
                request.getCharacterEncoding());
        String responseBody = getStringValue(responseWrapper.getContentAsByteArray(),
                response.getCharacterEncoding());

        LOGGER.info(
                "FINISHED PROCESSING : METHOD={}; REQUESTURI={}; REQUEST PAYLOAD={}; RESPONSE CODE={}; RESPONSE={}; TIME TAKEN={}",
                request.getMethod(), request.getRequestURI(), requestBody, response.getStatus(), responseBody,
                timeTaken);

        this.pool.submit(() -> {
            try {
//                this.pushRequest("{\"username\":\"root\",\"password\":\"password\"}");
                // TODO : Set DataBinding params properly
                this.pushRequest(new DataBinding());
            } catch (IOException e) {
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

    private DataBinding createDataBinding(HttpServletRequest request, HttpServletResponse response) {
        DataBinding bind = new DataBinding();
        bind.request_url_host = request.getRemoteHost();
        bind.request_url_path = request.getRequestURI();
        bind.request_url_parameters = listParamFormat(request.getParameterMap());
        //        bind.request_headers = listParamFormat(request.head());
        //        request.getHeaderNames()

        return bind;
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

    //    private List<Map<String, String>> listHeaderFormat(Enumeration<String> headerNames(),) {
    //    }

    private class DataBinding {
        String request_url_host;
        String request_url_path;
        List<Map<String, String>> request_url_parameters;
        List<Map<String, String>> request_headers;
        String request_body;
        String request_method;
        String response_url;
        String response_status;
        List<HashMap<String, String>> response_headers;
        String response_body;
        String meta_environment = "production";
        Boolean meta_incoming = true;
        String meta_source;
        Integer meta_sourcePort;
        String meta_destination;
        String meta_destinationPort;
        String meta_metloSource = "java/spring";

        public DataBinding() {
        }
    }


}
