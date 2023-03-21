package metlo;

import java.io.PrintWriter;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import com.google.common.util.concurrent.ListenableFuture;
import io.grpc.Grpc;
import io.grpc.InsecureChannelCredentials;
import io.grpc.ManagedChannel;
import io.grpc.StatusRuntimeException;
import metloingest.MetloIngestGrpc;
import metloingest.Metloingest;


class GrpcClient {
    public static void send(MetloIngestGrpc.MetloIngestFutureStub stub, Metloingest.ApiTrace data, PrintWriter err) throws ExecutionException, InterruptedException {
        Metloingest.ProcessTraceAsyncRes response = null;
        try {
            response = stub.processTraceAsync(data).get();
            if (!response.getOk()) {
                err.println("Received an error in analyzing trace to Metlo");
            }
        } catch (StatusRuntimeException e) {
            err.printf("RPC failed: %s", e.getStatus());
            e.printStackTrace(err);
        }
    }
}


public class RateLimitedRequests {
    private final Integer rps;
    private final Integer port;
    private final ThreadPoolExecutor pool;
    private final PrintWriter out;
    private final PrintWriter err;
    private final MetloIngestGrpc.MetloIngestFutureStub stub;
    private final ManagedChannel channel;
    private List<Long> ts;

    public RateLimitedRequests(Integer rps, Integer port, Integer pool_size, PrintWriter out, PrintWriter err) {
        this.rps = rps;
        this.port = port;
        this.out = out;
        this.err = err;
        this.ts = Collections.synchronizedList(new ArrayList<Long>());
        this.pool = new ThreadPoolExecutor(0, pool_size,
                60L, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>());
        String target = "localhost:" + port.toString();
        this.channel = Grpc.newChannelBuilder(target, InsecureChannelCredentials.create()).build();
        this.stub = MetloIngestGrpc.newFutureStub(this.channel);
    }

    public void shutdown() {
        this.channel.shutdown();
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

    public void send(Metloingest.ApiTrace data) {
        if (this.allow()) {
            this.pool.submit(() -> {
                try {
                    GrpcClient.send(this.stub, data, this.err);
                } catch (Exception e) {
                    e.printStackTrace(this.err);
                }
            });
        }
    }


}
