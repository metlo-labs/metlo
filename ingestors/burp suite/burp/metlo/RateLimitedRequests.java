package burp.metlo;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import com.google.gson.Gson;

public class RateLimitedRequests {
    private final Integer rps;
    private final String host;
    private final String key;
    private final ThreadPoolExecutor pool;
    private final burp.api.montoya.logging.Logging logger;
    private List<Long> ts;

    public RateLimitedRequests(Integer rps, Integer pool_size, String host, String api_key, burp.api.montoya.logging.Logging logger) {
        this.rps = rps;
        this.host = host;
        this.key = api_key;
        this.logger = logger;
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
        this.logger.logToOutput(json);

        String fkJSON = "{\"request\":{\"url\":{\"host\":\"test-ecommerce.metlo.com\",\"path\":\"/testing/alert/another/injection\",\"parameters\":[]},\"headers\":[{\"name\":\"X-API-KEY\",\"value\":\"e31f84ba-d92a-419b-b7ba-ef5e9df982f1\"}],\"method\":\"POST\",\"body\":\"{\\\"username\\\":\\\"admin\\\",\\\"inj\\\":\\\"-1' and 1=1 union/* foo */select load_file('/etc/passwd')--\\\"}\"},\"response\":{\"status\":200,\"headers\":[{\"name\":\"content-type\",\"value\":\"application/json; charset=utf-8\"}],\"body\":\"{\\\"username\\\":\\\"admin\\\",\\\"user\\\":\\\"admin@test.com\\\"}\"},\"meta\":{\"environment\":\"production\",\"incoming\":true,\"source\":\"17.99.145.104\",\"sourcePort\":17319,\"destination\":\"76.47.25.189\",\"destinationPort\":443}}";

        byte[] out = json.getBytes(StandardCharsets.UTF_8);
        int length = out.length;


        http.setFixedLengthStreamingMode(length);
        http.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        http.connect();
        try (OutputStream os = http.getOutputStream()) {
            os.write(out);
        }
        int code = http.getResponseCode();
        this.logger.logToOutput("Code: " + code);
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
