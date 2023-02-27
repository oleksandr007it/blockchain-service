package com.htegaming.metadata;

import com.htegaming.metadata.config.MetadataConfigurationProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(MetadataConfigurationProperties.class)
public class BlockchainMetadataApp {
    public static void main(String[] args) {
        SpringApplication.run(BlockchainMetadataApp.class, args);
    }
}