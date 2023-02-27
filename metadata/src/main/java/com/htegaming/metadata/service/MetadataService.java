package com.htegaming.metadata.service;

import com.htegaming.metadata.config.MetadataConfigurationProperties;
import com.netflix.dgs.codegen.generated.types.Blockchain;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MetadataService {
    private final MetadataConfigurationProperties properties;

    public List<Blockchain> getMetadata() {
        return properties.getMetadata();
    }

    public Optional<Blockchain> getMetadata(String blockchainCode) {
        return properties.getMetadata()
                .stream()
                .filter(blockchain -> blockchain.getCode().equalsIgnoreCase(blockchainCode))
                .findFirst();
    }
}
