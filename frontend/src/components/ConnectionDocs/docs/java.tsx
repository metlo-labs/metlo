import React from "react"
import { Box, Code, Heading, VStack, Link } from "@chakra-ui/react"
import { ListNumber } from "components/utils/ListNumber"
import SyntaxHighlighter from "react-syntax-highlighter"
import { DocsParams } from "./types"

const JavaDocs: React.FC<DocsParams> = React.memo(({ host, apiKey }) => {
  return (
    <VStack spacing={6} w="full">
      <ListNumber num={1} title="Install">
        <VStack spacing={1} w="full">
          <Box w="full">
            Currently Metlo&apos;s Java Agent supports 1 framework:
          </Box>
          <Box w="full">
            &nbsp;&nbsp;-&nbsp; Spring (and by extension Spring Boot)
          </Box>
          <Box w="full" paddingBlock={2}>
            Its available for download from
            <Link
              href="https://repo1.maven.org/maven2/com/metlo/spring/"
              color={"blue"}
            >
              &nbsp;maven central
            </Link>
          </Box>
        </VStack>
        <Box w="full">
          <VStack spacing={2} pb={2}>
            <Box w="full">You can add Metlo via either Maven or Gradle:</Box>
          </VStack>
          <VStack w="full" spacing={3}>
            <Heading size={"sm"} w="full">
              Gradle
            </Heading>
            <Code w="full" p="2">
              <SyntaxHighlighter
                customStyle={{ background: "none", padding: 0 }}
                language="gradle"
              >
                {`dependencies {
  ...
  implementation com.metlo.spring: 0.3
}`}
              </SyntaxHighlighter>
            </Code>
            <Heading size={"sm"} w="full">
              Maven
            </Heading>
            <Code w="full" p="2">
              <SyntaxHighlighter
                customStyle={{ background: "none", padding: 0 }}
                language="xml"
              >
                {`<dependencies>
    ...
    <dependency>
        <groupId>com.metlo</groupId>
        <artifactId>spring</artifactId>
        <version>0.3</version>
        <scope>compile</scope>
    </dependency>
</dependencies>`}
              </SyntaxHighlighter>
            </Code>
          </VStack>
        </Box>
      </ListNumber>
      <ListNumber num={2} title="Setup">
        <p>
          Metlo for Spring/Boot provides a lightweight filter for spring based
          applications and can be included as any other filter would. The filter
          needs to be provided with the Metlo collector url, and the Metlo API
          Key as parameters.
        </p>
        <Code w="full" p={2}>
          <SyntaxHighlighter
            customStyle={{ background: "none", padding: 0 }}
            language="java"
          >{`package com.example.demo;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Metlo imprted here
import com.metlo.spring.Metlo;

@Configuration
public class FilterConfig {

    @Bean
    public FilterRegistrationBean<Metlo> loggingFilter() {
        FilterRegistrationBean<Metlo> registrationBean = new FilterRegistrationBean<>();

        // Metlo registered as a filter here
        registrationBean.setFilter(new Metlo("${host}", "${apiKey}"));
        registrationBean.setOrder(2);
        return registrationBean;
    }

}`}</SyntaxHighlighter>
        </Code>
      </ListNumber>
      <ListNumber num={3} title="Configuration">
        <p>
          Metlo rate limits itself to 10 requests/s by default. In case the
          system has the capacity to handle more and/or a larger number of
          traces needs to be reported for some reason, that can be customised in
          the constructor with the signature:
        </p>
        <Code w="full" p={2}>
          <SyntaxHighlighter
            customStyle={{ background: "none", padding: 0 }}
            language="java"
          >
            public Metlo( String host, String api_key, Integer rps)
          </SyntaxHighlighter>
        </Code>
      </ListNumber>
    </VStack>
  )
})
export default JavaDocs
