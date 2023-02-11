package burp;

import burp.api.montoya.http.handler.HttpResponseReceived;

import javax.swing.table.AbstractTableModel;
import java.util.ArrayList;
import java.util.List;

public class TableModel extends AbstractTableModel {
    private final List<HttpResponseReceived> log;

    public TableModel() {
        this.log = new ArrayList<>();
    }

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
        return switch (column) {
            case 0 -> "Tool";
            case 1 -> "Method";
            case 2 -> "URL";
            case 3 -> "PII Detected";
            default -> "";
        };
    }

    @Override
    public synchronized Object getValueAt(int rowIndex, int columnIndex) {
        HttpResponseReceived responseReceived = log.get(rowIndex);

        return switch (columnIndex) {
            case 0 -> responseReceived.toolSource().toolType();
            case 1 -> responseReceived.initiatingRequest().method();
            case 2 -> responseReceived.initiatingRequest().url();
            case 3 -> "Coming Soon";
            default -> "";
        };
    }

    public synchronized void add(HttpResponseReceived responseReceived) {
        int index = log.size();
        log.add(responseReceived);
        fireTableRowsInserted(index, index);
    }

    public synchronized HttpResponseReceived get(int rowIndex) {
        return log.get(rowIndex);
    }
}