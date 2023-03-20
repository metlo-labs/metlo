package metlo;

import java.io.IOException;
import java.io.PrintWriter;
import java.net.HttpURLConnection;
import java.net.SocketTimeoutException;
import java.net.URL;

public class PingHome {

    private final String host;
    private final String api_key;

    private final PrintWriter out;
    private final PrintWriter err;

    public PingHome(String host, String api_key, PrintWriter out, PrintWriter err) {
        this.host = host;
        this.api_key = api_key;
        this.out = out;
        this.err = err;
    }

    public boolean ping() throws IOException {
        try {
            URL url = new URL(this.host);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(5000);
            conn.setInstanceFollowRedirects(true);
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", this.api_key);
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            int code = conn.getResponseCode();
            if (code == 404) {
                err.println("Metlo host at " + this.host + " is unreachable.\n" +
                        "Metlo host may be incorrect or metlo version may be old");
                return false;
            } else if (code == 401) {
                err.println("Could not validate Metlo API key. ");
                return false;
            } else if (code != 200) {
                err.println("Problem encountered while validating connection to Metlo.\n" +
                        "Received error code " + code + ". Enabling by default");
                return true;
            }
            out.println("Metlo connection validated successfully.");
            return true;
        } catch (SocketTimeoutException e) {
            err.println("Could not connect to Metlo. Connection took longer than 5 seconds and timed out");
            return false;
        }
    }
}
