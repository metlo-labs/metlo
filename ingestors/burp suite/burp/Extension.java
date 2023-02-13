package burp;

import burp.metlo.RateLimitedRequests;

import java.awt.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.List;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.table.AbstractTableModel;
import javax.swing.table.TableModel;

public class Extension extends AbstractTableModel implements IBurpExtender, ITab, IHttpListener, IMessageEditorController {
    private final List<LogEntry> log = new ArrayList<>();
    private final String METLO_APIKEY_KEY = "METLO_API_KEY";
    private final String METLO_URL_KEY = "METLO_URL_KEY";
    private Integer threads;
    private Integer rps;
    private String metloApiKey = null;
    private String metloUrl = null;
    private String metloUrlWithEndpoint = null;
    private RateLimitedRequests requests;
    private IBurpExtenderCallbacks callbacks;
    private IExtensionHelpers helpers;
    private Component component;
    private IMessageEditor requestViewer;
    private IMessageEditor responseViewer;
    private IHttpRequestResponse currentlyDisplayedItem;
    private PrintWriter err;
    private PrintWriter out;

    private Map<String, Object> createDataBinding(IHttpRequestResponse requestResponse, burp.IRequestInfo req, burp.IResponseInfo res) {
        Map<String, Object> DATA = new HashMap<>();
        Map<String, Object> REQUEST = new HashMap<>();
        Map<String, Object> REQUEST_URL = new HashMap<>();
        Map<String, Object> RESPONSE = new HashMap<>();
        Map<String, Object> META = new HashMap<>();
        URL reqURL = req.getUrl();
        REQUEST_URL.put("host", reqURL.getHost());
        REQUEST_URL.put("path", reqURL.getPath());
        if (reqURL.getQuery() != null) {
            REQUEST_URL.put("parameters", this.HTTPQueryToMap(reqURL.getQuery().split("&")));
        } else {
            REQUEST_URL.put("parameters", new ArrayList<String>());
        }
        REQUEST.put("url", REQUEST_URL);
        try {
            REQUEST.put("headers", this.headersToMap(req.getHeaders()));
        } catch (Exception e) {
            e.printStackTrace(this.err);
            REQUEST.put("headers", new ArrayList<Map<String, String>>());
        }
        int reqLen = requestResponse.getRequest().length - req.getBodyOffset();
        byte[] req_body = new byte[reqLen];
        System.arraycopy(requestResponse.getRequest(), req.getBodyOffset(), req_body, 0, reqLen);

        int resLen = requestResponse.getResponse().length - res.getBodyOffset();
        byte[] res_body = new byte[resLen];
        System.arraycopy(requestResponse.getResponse(), res.getBodyOffset(), res_body, 0, resLen);
        REQUEST.put("body", new String(req_body, StandardCharsets.UTF_8));
        REQUEST.put("method", req.getMethod());

        RESPONSE.put("status", res.getStatusCode());
        try {
            RESPONSE.put("headers", this.headersToMap(res.getHeaders()));
        } catch (Exception e) {
            e.printStackTrace(this.err);
            RESPONSE.put("headers", new ArrayList<Map<String, String>>());
        }

        RESPONSE.put("body", new String(res_body, StandardCharsets.UTF_8));
        String hostAddress = "0.0.0.0";
        try {
            InetAddress inet = InetAddress.getByName(reqURL.getHost());
            hostAddress = inet.getHostAddress();
        } catch (UnknownHostException e) {
            e.printStackTrace(this.err);
        }

        META.put("source", "127.0.0.1");
        META.put("sourcePort", 0);
        META.put("destination", hostAddress);
        META.put("destinationPort", reqURL.getPort());
        META.put("environment", "production");
        META.put("incoming", "true");
        META.put("metloSource", "burp_suite");

        DATA.put("request", REQUEST);
        DATA.put("response", RESPONSE);
        DATA.put("meta", META);

        return DATA;
    }

    private List<Map<String, String>> HTTPQueryToMap(String[] params) {
        List<Map<String, String>> _formatted_params_ = new ArrayList<>();
        for (String paramRaw : params) {
            String[] split = paramRaw.split("=");
            if (split.length != 2) {
                continue;
            } else {
                Map<String, String> _map = new HashMap<>();
                _map.put("name", URLDecoder.decode(split[0], StandardCharsets.UTF_8));
                _map.put("value", URLDecoder.decode(split[1], StandardCharsets.UTF_8));
                _formatted_params_.add(_map);
            }
        }
        return _formatted_params_;
    }

    private List<Map<String, String>> headersToMap(List<String> headers) {
        List<Map<String, String>> _formatted_headers_ = new ArrayList<>();
        for (String header : headers) {
            String[] splits = header.split(":", 2);
            if (splits.length == 2) {
                Map<String, String> _map = new HashMap<>();
                _map.put("name", URLDecoder.decode(splits[0], StandardCharsets.UTF_8));
                _map.put("value", URLDecoder.decode(splits[1], StandardCharsets.UTF_8));
                _formatted_headers_.add(_map);
            }
        }
        return _formatted_headers_;
    }

    //
    // implement IBurpExtender
    //

    @Override
    public void registerExtenderCallbacks(final IBurpExtenderCallbacks callbacks) {
        // keep a reference to our callbacks object
        this.callbacks = callbacks;

        // obtain an extension helpers object
        this.helpers = callbacks.getHelpers();

        this.err = new PrintWriter(this.callbacks.getStderr(), true);
        this.out = new PrintWriter(this.callbacks.getStdout(), true);

        // set our extension name
        callbacks.setExtensionName("Metlo Agent");
        try {
            List<String> f = Files.readAllLines(Paths.get("/Users/" + System.getProperty("user.name") + "/.metlo/credentials"), StandardCharsets.UTF_8);
            for (String line : f) {
                if (line.contains("REQUESTS_PER_SEC")) {
                    this.rps = Integer.parseInt(line.substring("REQUESTS_PER_SEC=".length()));
                    this.out.println("Loaded Requests/s from config. Set to " + this.rps);
                }
                if (line.contains("MAX_THREADS")) {
                    this.threads = Integer.parseInt(line.substring("MAX_THREADS=".length()));
                    this.out.println("Loaded Max Threads from config. Set max threads to " + this.threads);
                }
            }
        } catch (Exception e) {
            this.rps = 100;
            this.threads = 2;
        }

        metloUrl = callbacks.loadExtensionSetting(METLO_URL_KEY);
        metloUrlWithEndpoint = metloUrl;
        if (metloUrl != null) {
            if (!metloUrl.endsWith("/")) {
                metloUrlWithEndpoint += "/";
            }
            metloUrlWithEndpoint += "api/v1/log-request/single";
        }
        metloApiKey = callbacks.loadExtensionSetting(METLO_APIKEY_KEY);

        this.requests = new RateLimitedRequests(this.rps,
                this.threads,
                metloUrlWithEndpoint,
                metloApiKey,
                this.out,
                this.err
        );

        // create our UI
        SwingUtilities.invokeLater(() -> {
            try {
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
                urlTextField.setText(metloUrl != null ? metloUrl : "");
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
                apiKeyPasswordField.setText(metloApiKey != null ? metloApiKey : "");

                jPanel2.add(apiKeyLabel, BorderLayout.LINE_START);
                jPanel2.add(apiKeyPasswordField, BorderLayout.CENTER);

                saveBtn.setText("Save Config");
                saveBtn.addActionListener((e) -> {
                    metloUrl = urlTextField.getText();
                    metloUrlWithEndpoint = metloUrl;
                    if (metloUrl != null) {
                        if (!metloUrl.endsWith("/")) {
                            metloUrlWithEndpoint += "/";
                        }
                        metloUrlWithEndpoint += "api/v1/log-request/single";
                    }
                    metloApiKey = apiKeyPasswordField.getText();
                    Extension.this.callbacks.saveExtensionSetting(METLO_URL_KEY, metloUrl);
                    Extension.this.callbacks.saveExtensionSetting(METLO_APIKEY_KEY, metloApiKey);
                    out.println("Updated config for Metlo");
                    requests = new RateLimitedRequests(10, 10, metloUrlWithEndpoint, metloApiKey, out, err);
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

    //
    // implement ITab
    //

    @Override
    public String getTabCaption() {
        return "Metlo";
    }

    @Override
    public Component getUiComponent() {
        return this.component;
    }

    //
    // implement IHttpListener
    //

    @Override
    public void processHttpMessage(int toolFlag, boolean messageIsRequest, IHttpRequestResponse messageInfo) {
        // only process responses
        if (!messageIsRequest) {
            // create a new log entry with the message details
            synchronized (log) {
                int row = log.size();
                try {
                    IHttpRequestResponsePersisted persistedReq = callbacks.saveBuffersToTempFiles((messageInfo));
                    this.requests.send(
                            this.createDataBinding(
                                    persistedReq,
                                    this.helpers.analyzeRequest(messageInfo.getHttpService(), messageInfo.getRequest()),
                                    this.helpers.analyzeResponse(messageInfo.getResponse())
                            ));
                    log.add(new LogEntry(toolFlag, persistedReq,
                            helpers.analyzeRequest(messageInfo).getUrl()));
                    fireTableRowsInserted(row, row);
                } catch (Exception e) {
                    e.printStackTrace(this.err);
                }
            }
        }
    }

    //
    // extend AbstractTableModel
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
    // implement IMessageEditorController
    // this allows our request/response viewers to obtain details about the messages being displayed
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

    //
    // extend JTable to handle cell selection
    //

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

//
// class to hold details of each log entry
//

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
