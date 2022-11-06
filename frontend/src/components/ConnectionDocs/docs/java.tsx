import { Box, Code, Heading, VStack, Link } from "@chakra-ui/react"
import NextLink from "next/link"

const JavaDocs = () => {
  return (
    <VStack>
      <Box pb={2} w={"full"}>
        <Box>Currently Metlo's Java Agent supports 1 framework:</Box>

        <Box>&nbsp;&nbsp;-&nbsp; Spring (and by extension Spring Boot)</Box>

        <Box paddingBlock={2}>
          Its available for download from
          <Link
            href="https://repo1.maven.org/maven2/com/metlo/spring/"
            color={"blue"}
          >
            &nbsp;maven central
          </Link>
        </Box>
      </Box>
      <Heading size="md" w={"full"}>
        Installation
      </Heading>
      <Box w={"full"}>
        <p>Metlo can easily be included in either gradle or maven projects: </p>
        <p>Gradle: </p>

        <Code w={"full"}>
          dependencies {"{"}
          <Box pl={4}>
            ....
            <Box>implementation</Box> com.metlo.spring:
            <Box>0.3</Box>
          </Box>
          {"}"}
        </Code>
        <p>Maven:</p>

        <Code w={"full"} p={2}>
          <Box paddingInline={4}>
            &lt;dependencies&gt;
            <Box> ....</Box>
            <Box paddingInline={4}>
              &lt;dependency&gt;
              <Box paddingInline={4}>
                <Box>&lt;groupId&gt;</Box>
                <Box paddingInline={4}>com.metlo</Box>
                <Box>&lt;/groupId&gt;</Box>
                <Box>&lt;artifactId&gt;</Box>
                <Box paddingInline={4}>spring</Box>
                <Box>&lt;/artifactId&gt;</Box>
                <Box>&lt;version&gt;</Box>
                <Box paddingInline={4}>0.3</Box>
                <Box>&lt;/version&gt;</Box>
                <Box>&lt;scope&gt;</Box>
                <Box paddingInline={4}>compile</Box>
                <Box>&lt;/scope&gt;</Box>
              </Box>
            </Box>
            <Box>&lt;/dependency&gt;</Box>
          </Box>
          <Box>&lt;/dependencies&gt;</Box>
        </Code>
      </Box>
      <p>
        Metlo for Spring/Boot provides a lightweight filter for spring based
        applications and can be included as any other filter would. The filter
        needs to be provided with the METLO collector url, and the METLO API Key
        as parameters.
      </p>
      <Heading size={"sm"} id="example" w={"full"}>
        Example
      </Heading>
      <Code className="lang-java" w={"full"}>
        <VStack>
          <Box w={"full"}>package com.example.demo;</Box>
          <Box w={"full"}>
            <Box w={"full"}>
              import
              org.springframework.boot.web.servlet.FilterRegistrationBean;
            </Box>
            <Box w={"full"}>
              import org.springframework.context.annotation.Bean;
            </Box>
            <Box w={"full"}>
              import org.springframework.context.annotation.Configuration;
            </Box>
          </Box>
          <Box w={"full"}>
            <Box w={"full"}>// Metlo imported here</Box>
            <Box w={"full"}>import com.metlo.spring.Metlo;</Box>
            <Box w={"full"}>@Configuration</Box>
            <Box w={"full"}>public class FilterConfig {"{"}</Box>
          </Box>
          <Box w={"full"} pl={4}>
            <Box w={"full"} className="hljs-meta">
              @Bean
            </Box>
            <Box w={"full"}>
              <Box w={"full"}>
                public FilterRegistrationBean&lt;Metlo&gt; loggingFilter() {"{"}
              </Box>
              <Box w={"full"} pl={4}>
                <Box w={"full"}>
                  FilterRegistrationBean&lt;Metlo&gt; registrationBean = new
                  FilterRegistrationBean&lt;&gt;(); // Metlo registered as a
                  filter
                </Box>
                <Box w={"full"}>here registrationBean.setFilter(new</Box>
                <Box w={"full"}>
                  Metlo("http://&lt;YOUR_METLO_ADDRESS&gt;:8081","&lt;YOUR_METLO_API_KEY&gt;");
                </Box>
                <Box w={"full"}>
                  registrationBean.setOrder(2); return registrationBean;
                </Box>
              </Box>
              <Box w={"full"}>{"}"}</Box>
            </Box>
          </Box>

          <Box w={"full"}>{"}"}</Box>
        </VStack>
      </Code>
      <Heading size="md" id="configuration" w={"full"}>
        Configuration
      </Heading>
      <Heading size="sm" id="rate-limiting" w={"full"}>
        Rate Limiting
      </Heading>
      <p>
        Metlo rate limits itself to 10 requests/s by default. In case the system
        has the capacity to handle more and/or a larger number of traces needs
        to be reported for some reason, that can be customised in the
        constructor with the signature:
      </p>
      <Code className="lang-java" w={"full"} p={2}>
        public Metlo( String host, String api_key, Integer rps)
      </Code>
    </VStack>
  )
}
export default JavaDocs
