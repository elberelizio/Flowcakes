package com.chefcontrol;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ChefControlApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChefControlApplication.class, args);
    }
}
