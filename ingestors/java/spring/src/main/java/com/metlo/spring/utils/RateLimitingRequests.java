package com.metlo.spring.utils;

// Min Java version 7 (since GSON 2.9)
import com.google.gson.Gson;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

public class RateLimitingRequests {
    private final Integer rps;
    private final String host;
    private final String key;
    private final ThreadPoolExecutor pool;
    private List<Long> ts;

    public RateLimitingRequests(Integer rps, Integer pool_size, String host, String api_key) {
        this.rps = rps;
        this.host = host;
        this.key = api_key;
        this.ts = Collections.synchronizedList(new ArrayList<Long>());
        this.pool = new ThreadPoolExecutor(0, pool_size,
                60L, TimeUnit.SECONDS,
                new LinkedBlockingQueue<Runnable>());
    }

    private void pushRequest(Map<String, Object> data) throws IOException {
        URL url = new URL(this.host);
        URLConnection con = url.openConnection();
        HttpURLConnection http = (HttpURLConnection) con;
        http.setRequestMethod("POST"); // PUT is another valid option
        http.setRequestProperty("Authorization", this.key);
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
        int code = http.getResponseCode();
    }


    private synchronized Boolean allow() {

        List<Long> tmp_ts = Collections.synchronizedList(new ArrayList<Long>());
        Long curr = Instant.now().toEpochMilli();
        this.ts.forEach((Long x) -> {
            // We care about requests in the last second only.
            if ((curr - x) <= 1000) {
                tmp_ts.add(x);
            }
        });

        this.ts = tmp_ts;

        if (this.ts.size() < this.rps) {
            this.ts.add(curr);
            return true;
        }
        return false;

    }

    public void send(Map<String, Object> data) {
        if (this.allow()) {
            this.pool.submit(() -> {
                try {
                    pushRequest(data);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }
    }


}
