package com.metlo.govxlan;

import java.io.*;
import java.lang.instrument.Instrumentation;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.security.CodeSource;
import java.security.ProtectionDomain;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

public class Agent {
    private static final List<String> LOG_LEVELS = Arrays.asList("info", "warn", "error", "trace", "debug");
    private static final String DEFAULT_LOG_LEVEL = "info";

    public static void premain(String agentArgs, Instrumentation inst) throws URISyntaxException, IOException {
        boolean canEnable = true;
        final URI uri;
        final URI exe;
        final URI libpcap;
        String os = System.getProperty("os.name");
        String useBinary = null;

        if (os.toLowerCase().contains("mac")) {
            // Running mac. Decide if using arm64 or amd64.
            // Rosetta should handle it fine though.
            useBinary = "binaries/metlo_pcap_darwin_amd64";
        } else if (os.toLowerCase().contains("windows")) {
            // Running windows. Don't configure for now.
        } else {
            // Running Linux
            useBinary = "binaries/metlo_pcap_linux_amd64";
        }

        canEnable = !Boolean.parseBoolean(System.getenv("METLO_DISABLED"));

        if (useBinary != null) {
            uri = getJarURI();
            exe = getFile(uri, useBinary);
            try {
                // create a new process
                List<String> args = new ArrayList<>();
                // Take substring 5...end to get rid of file:// URI indicator at start
                args.add(exe.toString().substring(5));

                ProcessBuilder builder = new ProcessBuilder(args);
                Map<String, String> envMap = builder.environment();
                envMap.remove("LOG_LEVEL");
                if (System.getenv("METLO_LOG_LEVEL") != null) {
                    if (Agent.LOG_LEVELS.contains(System.getenv("METLO_LOG_LEVEL"))) {
                        envMap.put("LOG_LEVEL", System.getenv("METLO_LOG_LEVEL"));
                    } else {
                        System.out.printf(
                                "Option %s not in any of the choices %s\n", System.getenv("LOG_LEVEL"), String.join(",", Agent.LOG_LEVELS)
                        );
                    }
                }
                if (System.getenv("METLO_KEY") != null) {
                    envMap.put("METLO_KEY", System.getenv("METLO_KEY"));
                }
                if (System.getenv("METLO_HOST") != null) {
                    envMap.put("METLO_HOST", System.getenv("METLO_HOST"));
                }
                envMap.remove("INTERFACE");
                if (System.getenv("METLO_INTERFACE") != null) {
                    envMap.put("INTERFACE", System.getenv("METLO_INTERFACE"));
                }
                envMap.remove("METLO_MAX_RPS");
                if (System.getenv("METLO_MAX_RPS") != null) {
                    envMap.put("MAX_RPS", System.getenv("METLO_MAX_RPS"));
                }

                if (!os.toLowerCase().contains("mac") && !os.toLowerCase().contains("windows")) {
                    libpcap = getFile(uri, "shared_objects/libpcap.so.0.8");
                    // Take substring 5...end to get rid of file:// URI indicator at start
                    String filePath = libpcap.toString().substring(5);
                    List<String> parts = Arrays.asList(filePath.split("/"));
                    envMap.put("LD_LIBRARY_PATH", String.join("/", parts.subList(0, parts.size() - 1)));
                }

                if (canEnable) {
                    builder.inheritIO();
                    Process pro = builder.start();
                } else {
                    System.out.println("Metlo has been disabled");
                }
            } catch (Exception ex) {
                System.out.println("Metlo agent for Java encountered an error.");
                ex.printStackTrace();
            }
        } else {
            System.out.println("Could not instrument metlo agent for java.");
        }
    }

    private static URI getJarURI()
            throws URISyntaxException {
        final ProtectionDomain domain;
        final CodeSource source;
        final URL url;
        final URI uri;

        domain = Agent.class.getProtectionDomain();
        source = domain.getCodeSource();
        url = source.getLocation();
        uri = url.toURI();

        return (uri);
    }

    private static URI getFile(final URI where,
                               final String fileName)
            throws
            IOException {
        final File location;
        final URI fileURI;

        location = new File(where);

        // not in a JAR, just return the path on disk
        if (location.isDirectory()) {
            fileURI = URI.create(where + fileName);
        } else {
            final ZipFile zipFile;

            zipFile = new ZipFile(location);

            try {
                fileURI = extract(zipFile, fileName);
            } finally {
                zipFile.close();
            }
        }

        return (fileURI);
    }

    private static URI extract(final ZipFile zipFile,
                               final String fileName)
            throws IOException {
        final File tempFile;
        final ZipEntry entry;
        final InputStream zipStream;
        OutputStream fileStream;

        List<String> parts = Arrays.asList(fileName.split("/"));

        tempFile = new File(System.getProperty("java.io.tmpdir") + "/" + parts.get(parts.size() - 1));
        tempFile.createNewFile();
        tempFile.deleteOnExit();
        tempFile.setExecutable(true);
        entry = zipFile.getEntry(fileName);

        if (entry == null) {
            throw new FileNotFoundException("cannot find file: " + fileName + " in archive: " + zipFile.getName());
        }

        zipStream = zipFile.getInputStream(entry);
        fileStream = null;

        try {
            final byte[] buf;
            int i;

            fileStream = new FileOutputStream(tempFile);
            buf = new byte[1024];
            i = 0;

            while ((i = zipStream.read(buf)) != -1) {
                fileStream.write(buf, 0, i);
            }
        } finally {
            close(zipStream);
            close(fileStream);
        }

        return (tempFile.toURI());
    }

    private static void close(final Closeable stream) {
        if (stream != null) {
            try {
                stream.close();
            } catch (final IOException ex) {
                ex.printStackTrace();
            }
        }
    }
}
