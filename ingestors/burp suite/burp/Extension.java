import burp.*;
import metlo.PingHome;
import metlo.RateLimitedRequests;
import metloingest.Metloingest;

import java.awt.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.CodeSource;
import java.security.ProtectionDomain;
import java.util.*;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.table.AbstractTableModel;
import javax.swing.table.TableModel;

public class Extension extends AbstractTableModel implements IBurpExtender, ITab, IHttpListener, IMessageEditorController {
    private final static String endpoint_log_single = "api/v1/log-request/single";
    private final static String endpoint_ping = "api/v1/verify";
    private final static String METLO_APIKEY_KEY = "METLO_API_KEY";
    private final static String METLO_URL_KEY = "METLO_URL_KEY";
    private final static Integer MIN_PORT = 30000;
    private final static Integer MAX_PORT = 55000;
    private final List<LogEntry> log = new ArrayList<>();
    private Integer threads;
    private Integer rps;
    private Integer PORT;
    private String metloApiKey = null;
    private String metloUrl = null;
    private RateLimitedRequests requests;
    private IBurpExtenderCallbacks callbacks;
    private IExtensionHelpers helpers;
    private Component component;
    private IMessageEditor requestViewer;
    private IMessageEditor responseViewer;
    private IHttpRequestResponse currentlyDisplayedItem;
    private PrintWriter err;
    private PrintWriter out;
    private Process subprocess;

    private URI getFile(final URI where, final String fileName) throws IOException {
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

    private URI extract(final ZipFile zipFile, final String fileName) throws IOException {
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

    private void close(final Closeable stream) {
        if (stream != null) {
            try {
                stream.close();
            } catch (final IOException ex) {
                ex.printStackTrace();
            }
        }
    }

    private URI getJarURI() throws URISyntaxException {
        final ProtectionDomain domain;
        final CodeSource source;
        final URL url;
        final URI uri;

        domain = Extension.class.getProtectionDomain();
        source = domain.getCodeSource();
        url = source.getLocation();
        uri = url.toURI();

        return (uri);
    }

    public void startSubprocess() throws URISyntaxException, IOException {
        boolean canEnable = true;
        final URI uri;
        final URI exe;
        String os = System.getProperty("os.name");
        String useBinary = null;

        if (os.toLowerCase().contains("mac")) {
            // Running mac. Decide if using arm64 or amd64.
            // Second question, do we care?
            // Rosetta should handle it, and you're not running prod stuff on a Mac device
            // anyway.
            useBinary = "dist/binaries/metlo-agent-mac";
        } else if (os.toLowerCase().contains("windows")) {
            useBinary = "dist/binaries/metlo-agent-windows";
        } else {
            // Running Linux
            useBinary = "dist/binaries/metlo-agent-linux";
        }

        if (useBinary != null) {
            uri = getJarURI();
            exe = getFile(uri, useBinary);
            try {
                // create a new process
                List<String> args = new ArrayList<>();
                // Take substring 5...end to get rid of file:// URI indicator at start
                args.add(exe.toString().substring(5));

                ProcessBuilder builder = new ProcessBuilder(args);
                builder.environment().put("METLO_HOST", this.metloUrl);
                builder.environment().put("METLO_KEY", this.metloApiKey);
                builder.environment().put("LOG_LEVEL", "error");
                builder.environment().put("PORT", Extension.this.PORT.toString());
                builder.inheritIO();
                this.subprocess = builder.start();
            } catch (Exception ex) {
                this.err.println("Metlo agent for Java encountered an error.");
                ex.printStackTrace(this.err);
            }
        } else {
            this.err.println("Could not instrument metlo agent for java.");
        }
    }


    //
    // implement IBurpExtender
    //

    private Metloingest.ApiTrace createDataBinding(IHttpRequestResponse requestResponse, burp.IRequestInfo req, burp.IResponseInfo res) {
        int reqLen = requestResponse.getRequest().length - req.getBodyOffset();
        byte[] req_body = new byte[reqLen];
        System.arraycopy(requestResponse.getRequest(), req.getBodyOffset(), req_body, 0, reqLen);
        URL reqURL = req.getUrl();

        Metloingest.ApiUrl REQUEST_URL = Metloingest.ApiUrl.newBuilder()
                .setHost(reqURL.getHost())
                .setPath(reqURL.getPath())
                .addAllParameters(
                        reqURL.getQuery() != null ?
                                this.HTTPQueryToMap(reqURL.getQuery().split("&")) :
                                new ArrayList<Metloingest.KeyVal>()
                )
                .build();

        int resLen = requestResponse.getResponse().length - res.getBodyOffset();
        byte[] res_body = new byte[resLen];
        System.arraycopy(requestResponse.getResponse(), res.getBodyOffset(), res_body, 0, resLen);

        Metloingest.ApiRequest REQUEST = Metloingest.ApiRequest.newBuilder()
                .setUrl(REQUEST_URL)
                .addAllHeaders(this.headersToMap(req.getHeaders()))
                .setMethod(req.getMethod())
                .setBody(new String(req_body, StandardCharsets.UTF_8))
                .build();
        Metloingest.ApiResponse RESPONSE = Metloingest.ApiResponse.newBuilder()
                .setStatus(res.getStatusCode())
                .setBody(new String(res_body, StandardCharsets.UTF_8))
                .addAllHeaders(this.headersToMap(res.getHeaders()))
                .build();
        String hostAddress = "0.0.0.0";
        try {
            InetAddress inet = InetAddress.getByName(reqURL.getHost());
            hostAddress = inet.getHostAddress();
        } catch (UnknownHostException e) {
            e.printStackTrace(this.err);
        }
        Metloingest.ApiMeta META = Metloingest.ApiMeta.newBuilder()
                .setSource("127.0.0.1")
                .setSourcePort(0)
                .setDestination(hostAddress)
                .setDestinationPort(reqURL.getPort())
                .setEnvironment("production")
                .setIncoming(true)
                .setSource("burp_suite")
                .build();
        Metloingest.ApiTrace TRACE = Metloingest.ApiTrace.newBuilder()
                .setRequest(REQUEST)
                .setResponse(RESPONSE)
                .setMeta(META)
                .build();

        return TRACE;
    }

    //
    // implement ITab
    //

    private List<Metloingest.KeyVal> HTTPQueryToMap(String[] params) {
        List<Metloingest.KeyVal> _formatted_params_ = new ArrayList<>();
        for (String paramRaw : params) {
            String[] splits = paramRaw.split("=");
            if (splits.length != 2) {
                continue;
            } else {
                _formatted_params_.add(Metloingest.KeyVal.newBuilder().
                        setName(URLDecoder.decode(splits[0], StandardCharsets.UTF_8)).
                        setValue(URLDecoder.decode(splits[1], StandardCharsets.UTF_8)).
                        build());
            }
        }
        return _formatted_params_;
    }

    private List<Metloingest.KeyVal> headersToMap(List<String> headers) {
        List<Metloingest.KeyVal> _formatted_headers_ = new ArrayList<>();
        try {
            for (String header : headers) {
                String[] splits = header.split(":", 2);
                if (splits.length == 2) {
                    _formatted_headers_.add(Metloingest.KeyVal.newBuilder().
                            setName(URLDecoder.decode(splits[0], StandardCharsets.UTF_8)).
                            setValue(URLDecoder.decode(splits[1], StandardCharsets.UTF_8)).
                            build());

                }
            }
        } catch (Exception e) {
            e.printStackTrace(this.err);
        }
        return _formatted_headers_;
    }

    //
    // implement IHttpListener
    //

    private void validateConfig() {
        try {
            String url = this.metloUrl;
            if (url != null) {
                if (!url.endsWith("/")) {
                    url += "/";
                }
                url += Extension.endpoint_ping;
            }
            new PingHome(url, this.metloApiKey, this.out, this.err).ping();
        } catch (Exception err) {
            err.printStackTrace(this.err);
            this.metloUrl = "";
            this.metloApiKey = "";
        }
    }

    //
    // extend AbstractTableModel
    //

    private void restartComponents(String _metloUrl, String _apiKey) {
        Extension.this.PORT = (new Random()).nextInt(MIN_PORT, MAX_PORT);
        Extension.this.metloUrl = _metloUrl;
        if (Extension.this.metloUrl != null) {
            boolean needsSlash = !Extension.this.metloUrl.endsWith("/");
            Extension.this.metloUrl += needsSlash ? "/" : "";
        }
        Extension.this.metloApiKey = _apiKey;
        Extension.this.requests = new RateLimitedRequests(
                Extension.this.rps,
                Extension.this.PORT,
                Extension.this.threads,
                Extension.this.out,
                Extension.this.err
        );
        if (Extension.this.subprocess != null) {
            Extension.this.subprocess.destroy();
        }
        try {
            (new URL(Extension.this.metloUrl)).toURI();
            if (Extension.this.metloUrl != null && Extension.this.metloApiKey != null) {
                validateConfig();
                Extension.this.startSubprocess();
            } else {
                if (Extension.this.metloUrl == null) {
                    this.err.println(
                            "Metlo URL is empty. Please input a valid Metlo Host and save!"
                    );
                }
                if (Extension.this.metloApiKey == null) {
                    this.err.println(
                            "Metlo API Key is empty. Please input a valid Metlo API Key and save!"
                    );
                }
            }
        } catch (URISyntaxException | MalformedURLException e) {
            this.err.println("Could not validate Metlo URL '" + _metloUrl + "'");
            e.printStackTrace(this.err);
        } catch (IOException e) {
            this.err.println("Could not start Metlo Analyzer");
            e.printStackTrace(this.err);
        }
    }

    private void shutdown() {
        if (Extension.this.subprocess != null) {
            Extension.this.subprocess.destroy();
        }
        Extension.this.requests.shutdown();
    }

    @Override
    public void registerExtenderCallbacks(final IBurpExtenderCallbacks callbacks) {
        // keep a reference to our callbacks object
        this.callbacks = callbacks;

        callbacks.setExtensionName("Metlo Agent");

        // obtain an extension helpers object
        this.helpers = callbacks.getHelpers();

        this.err = new PrintWriter(this.callbacks.getStderr(), true);
        this.out = new PrintWriter(this.callbacks.getStdout(), true);

        // set our extension name
        try {
            List<String> f = Files.readAllLines(Paths.get("/Users/" + System.getProperty("user.name") + "/.metlo/credentials"), StandardCharsets.UTF_8);
            for (String line : f) {
                if (line.startsWith("REQUESTS_PER_SEC")) {
                    this.rps = Integer.parseInt(line.substring("REQUESTS_PER_SEC=".length()));
                    this.out.println("Loaded Requests/s from config. Set to " + this.rps);
                }
                if (line.startsWith("MAX_THREADS")) {
                    this.threads = Integer.parseInt(line.substring("MAX_THREADS=".length()));
                    this.out.println("Loaded Max Threads from config. Set max threads to " + this.threads);
                }
            }
            if (this.rps == null) {
                this.rps = 100;
            }
            if (this.threads == null) {
                this.threads = 2;
            }
        } catch (Exception e) {
            this.rps = 100;
            this.threads = 2;
        }

        String _startupMetloUrl = callbacks.loadExtensionSetting(METLO_URL_KEY);
        String _startupApiKey = callbacks.loadExtensionSetting(METLO_APIKEY_KEY);

        // Add shutdown hooks
        callbacks.registerExtensionStateListener(this::shutdown);
        Runtime.getRuntime().addShutdownHook(new Thread(this::shutdown));

        // create our UI
        SwingUtilities.invokeLater(() -> {
            try {
                restartComponents(_startupMetloUrl, _startupApiKey);

                JPanel primary = new JPanel();
                component = primary;
                JPanel jPanel1 = new javax.swing.JPanel();
                JLabel urlLabel = new javax.swing.JLabel();
                JTextField urlTextField = new javax.swing.JTextField();

                JPanel jPanel2 = new javax.swing.JPanel();
                JPanel jPanel3 = new javax.swing.JPanel();
                JPanel jPanel4 = new javax.swing.JPanel();
                JLabel apiKeyLabel = new javax.swing.JLabel();
                JButton saveBtn = new javax.swing.JButton();
                JSeparator jSeparator1 = new javax.swing.JSeparator();
                primary.setLayout(new javax.swing.BoxLayout(primary, javax.swing.BoxLayout.Y_AXIS));

                jPanel1.setMaximumSize(new Dimension(Integer.MAX_VALUE, 33));
                jPanel1.setMinimumSize(new Dimension(100, 33));
                jPanel1.setLayout(new BorderLayout(20, 0));
                jPanel1.setBorder(new EmptyBorder(5, 10, 0, 10));

                urlLabel.setText("Metlo URL");
                urlLabel.setMaximumSize(null);
                urlLabel.setPreferredSize(new Dimension(100, 33));
                urlLabel.setMinimumSize(new Dimension(100, 33));
                urlLabel.setMaximumSize(new Dimension(100, 33));
                urlTextField.setText(_startupMetloUrl != null ? _startupMetloUrl : "");
                urlTextField.setMaximumSize(new Dimension(Integer.MAX_VALUE, 33));
                urlTextField.setMinimumSize(new Dimension(100, 33));
                urlTextField.setPreferredSize(new Dimension(100, 33));

                jPanel1.add(urlLabel, BorderLayout.LINE_START);
                jPanel1.add(urlTextField, BorderLayout.CENTER);

                primary.add(jPanel1);

                jPanel2.setMaximumSize(new Dimension(Integer.MAX_VALUE, 33));
                jPanel2.setMinimumSize(new Dimension(100, 33));
                jPanel2.setLayout(new BorderLayout(20, 0));
                jPanel2.setBorder(new EmptyBorder(5, 10, 5, 10));

                apiKeyLabel.setText("API Key");
                apiKeyLabel.setPreferredSize(new Dimension(100, 33));
                apiKeyLabel.setMaximumSize(new Dimension(100, 33));
                apiKeyLabel.setMinimumSize(new Dimension(100, 33));
                JPasswordField apiKeyPasswordField = new javax.swing.JPasswordField();
                apiKeyPasswordField.setText(_startupApiKey != null ? _startupApiKey : "");

                jPanel2.add(apiKeyLabel, BorderLayout.LINE_START);
                jPanel2.add(apiKeyPasswordField, BorderLayout.CENTER);

                saveBtn.setText("Save Config");
                saveBtn.addActionListener((e) -> {
                    restartComponents(urlTextField.getText(), apiKeyPasswordField.getText());

                    Extension.this.callbacks.saveExtensionSetting(METLO_URL_KEY, Extension.this.metloUrl);
                    Extension.this.callbacks.saveExtensionSetting(METLO_APIKEY_KEY, Extension.this.metloApiKey);

                    out.println("Updated config for Metlo");
                });

                saveBtn.setBackground(new Color(2384017)); // Corresponds to rgb 66, 76, 249
                saveBtn.setForeground(Color.WHITE);
                jPanel3.setBorder(javax.swing.BorderFactory.createEmptyBorder(5, 5, 5, 5));
                jPanel3.setMaximumSize(new java.awt.Dimension(Integer.MAX_VALUE, 35));
                jPanel3.setMinimumSize(new java.awt.Dimension(100, 35));
                jPanel3.setName("");
                jPanel3.setLayout(new java.awt.BorderLayout());
                jPanel3.add(saveBtn, java.awt.BorderLayout.EAST);
                jPanel3.setBorder(new EmptyBorder(5, 10, 5, 10));

                jPanel4.setLayout(new BorderLayout());

                primary.add(jPanel2);
                primary.add(jPanel3);
                primary.add(jSeparator1);
                primary.add(jPanel4);


                // main split pane
                JSplitPane splitPane = new JSplitPane(JSplitPane.VERTICAL_SPLIT);
                jPanel4.add(splitPane);
                // table of log entries
                Table logTable = new Table(Extension.this);
                JScrollPane scrollPane = new JScrollPane(logTable);
                splitPane.setLeftComponent(scrollPane);

                // tabs with request/response viewers
                JTabbedPane tabs = new JTabbedPane();
                requestViewer = callbacks.createMessageEditor(Extension.this, false);
                responseViewer = callbacks.createMessageEditor(Extension.this, false);
                tabs.addTab("Request", requestViewer.getComponent());
                tabs.addTab("Response", responseViewer.getComponent());
                splitPane.setRightComponent(tabs);

                // customize our UI components
                callbacks.customizeUiComponent(splitPane);
                callbacks.customizeUiComponent(logTable);
                callbacks.customizeUiComponent(scrollPane);
                callbacks.customizeUiComponent(tabs);

                // add the custom tab to Burp's UI
                callbacks.addSuiteTab(Extension.this);

                // register ourselves as an HTTP listener
                callbacks.registerHttpListener(Extension.this);
            } catch (Exception e) {
                e.printStackTrace(this.err);
            }
        });
    }

    @Override
    public String getTabCaption() {
        return "Metlo";
    }

    @Override
    public Component getUiComponent() {
        return this.component;
    }

    @Override
    public void processHttpMessage(int toolFlag, boolean messageIsRequest, IHttpRequestResponse messageInfo) {
        // only process responses
        if (!messageIsRequest) {
            // create a new log entry with the message details
            synchronized (log) {
                int row = log.size();
                try {
                    IHttpRequestResponsePersisted persistedReq = callbacks.saveBuffersToTempFiles((messageInfo));
                    this.requests.send(this.createDataBinding(persistedReq, this.helpers.analyzeRequest(messageInfo.getHttpService(), messageInfo.getRequest()), this.helpers.analyzeResponse(messageInfo.getResponse())));
                    log.add(new LogEntry(toolFlag, persistedReq, helpers.analyzeRequest(messageInfo).getUrl()));
                    fireTableRowsInserted(row, row);
                } catch (Exception e) {
                    e.printStackTrace(this.err);
                }
            }
        }
    }

    //
    // implement IMessageEditorController
    // this allows our request/response viewers to obtain details about the messages being displayed
    //

    @Override
    public synchronized int getRowCount() {
        return log.size();
    }

    @Override
    public int getColumnCount() {
        return 4;
    }

    @Override
    public String getColumnName(int column) {
        String col;
        switch (column) {
            case 0:
                col = "Tool";
                break;
            case 1:
                col = "Method";
                break;
            case 2:
                col = "URL";
                break;
            case 3:
                col = "PII Detected";
                break;
            default:
                col = "";
        }
        return col;
    }

    //
    // extend JTable to handle cell selection
    //

    @Override
    public synchronized Object getValueAt(int rowIndex, int columnIndex) {
        LogEntry entry = log.get(rowIndex);
        Object col;
        switch (columnIndex) {
            case 0:
                col = callbacks.getToolName(entry.tool);
                break;
            case 1:
                col = helpers.analyzeRequest(entry.requestResponse.getRequest()).getMethod();
                break;
            case 2:
                col = helpers.analyzeRequest(entry.requestResponse).getUrl();
                break;
            case 3:
                col = "Coming Soon";
                break;
            default:
                col = "";
        }
        return col;
    }

//
// class to hold details of each log entry
//

    @Override
    public byte[] getRequest() {
        return currentlyDisplayedItem.getRequest();
    }

    @Override
    public byte[] getResponse() {
        return currentlyDisplayedItem.getResponse();
    }

    @Override
    public IHttpService getHttpService() {
        return currentlyDisplayedItem.getHttpService();
    }

    private static class LogEntry {
        final int tool;
        final IHttpRequestResponsePersisted requestResponse;
        final URL url;

        LogEntry(int tool, IHttpRequestResponsePersisted requestResponse, URL url) {
            this.tool = tool;
            this.requestResponse = requestResponse;
            this.url = url;
        }
    }

    private class Table extends JTable {
        public Table(TableModel tableModel) {
            super(tableModel);
        }

        @Override
        public void changeSelection(int row, int col, boolean toggle, boolean extend) {
            // show the log entry for the selected row
            LogEntry logEntry = log.get(row);
            requestViewer.setMessage(logEntry.requestResponse.getRequest(), true);
            responseViewer.setMessage(logEntry.requestResponse.getResponse(), false);
            currentlyDisplayedItem = logEntry.requestResponse;

            super.changeSelection(row, col, toggle, extend);
        }
    }
}
