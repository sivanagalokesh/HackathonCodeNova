package com.codenova;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CodeNovaApplication {
    public static void main(String[] args) {
        SpringApplication.run(CodeNovaApplication.class, args);
    }
}
