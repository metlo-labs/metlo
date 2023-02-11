package burp;

import burp.api.montoya.BurpExtension;
import burp.api.montoya.MontoyaApi;
import burp.api.montoya.http.handler.HttpResponseReceived;
import burp.api.montoya.ui.UserInterface;
import burp.api.montoya.ui.editor.HttpRequestEditor;
import burp.api.montoya.ui.editor.HttpResponseEditor;

import javax.swing.*;
import java.awt.*;

import static burp.api.montoya.ui.editor.EditorOptions.READ_ONLY;

public class Extension implements BurpExtension {
    private MontoyaApi api;
    private burp.api.montoya.logging.Logging logger;

    @Override
    public void initialize(MontoyaApi api) {
        this.api = api;
        this.logger = api.logging();
        api.extension().setName("Metlo");

        TableModel tableModel = new TableModel();
        api.userInterface().registerSuiteTab("Metlo", constructLoggerTab(tableModel));
        api.http().registerHttpHandler(new CustomHttpHandler(tableModel, logger));
    }

    private Component constructLoggerTab(TableModel tableModel) {
        // main split pane
        JSplitPane splitPane = new JSplitPane(JSplitPane.VERTICAL_SPLIT);

        // tabs with request/response viewers
        JTabbedPane tabs = new JTabbedPane();

        UserInterface userInterface = api.userInterface();

        HttpRequestEditor requestViewer = userInterface.createHttpRequestEditor(READ_ONLY);
        HttpResponseEditor responseViewer = userInterface.createHttpResponseEditor(READ_ONLY);

        tabs.addTab("Request", requestViewer.uiComponent());
        tabs.addTab("Response", responseViewer.uiComponent());

        splitPane.setRightComponent(tabs);

        // table of log entries
        JTable table = new JTable(tableModel) {
            @Override
            public void changeSelection(int rowIndex, int columnIndex, boolean toggle, boolean extend) {
                // show the log entry for the selected row
                HttpResponseReceived responseReceived = tableModel.get(rowIndex);
                requestViewer.setRequest(responseReceived.initiatingRequest());
                responseViewer.setResponse(responseReceived);

                super.changeSelection(rowIndex, columnIndex, toggle, extend);
            }
        };

        JScrollPane scrollPane = new JScrollPane(table);

        splitPane.setLeftComponent(scrollPane);

        return splitPane;
    }
}