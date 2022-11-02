package com.metlo.spring.utils;

import org.springframework.web.util.ContentCachingResponseWrapper;

import javax.servlet.http.HttpServletResponse;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public class ContentCachingResponseWrapperWithHeaderNames extends ContentCachingResponseWrapper {
    /**
     * Here to provide a wrapper to HTTPServletResponse so that we can capture more of the headers.
     */
    private final Set<String> headerNames = new HashSet<String>();

    public ContentCachingResponseWrapperWithHeaderNames(HttpServletResponse delegate) {
        super(delegate);
    }

    public void addHeader(String name, String value) {
        super.addHeader(name, value);
        headerNames.add(name);
    }

    public void addDateHeader(String name, long date) {
        super.addDateHeader(name, date);
        headerNames.add(name);
    }

    public void addIntHeader(String name, int value) {
        super.addIntHeader(name, value);
        headerNames.add(name);
    }

    public void setHeader(String name, String value) {
        super.setHeader(name, value);
        headerNames.add(name);
    }

    public void setDateHeader(String name, long date) {
        super.setDateHeader(name, date);
        headerNames.add(name);
    }

    public void setIntHeader(String name, int value) {
        super.setIntHeader(name, value);
        headerNames.add(name);
    }


    public Set<String> getHeaderNames() {
        return Collections.unmodifiableSet(headerNames);
    }
}
