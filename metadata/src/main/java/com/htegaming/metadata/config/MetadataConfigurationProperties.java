package com.htegaming.metadata.config;

import com.netflix.dgs.codegen.generated.types.Blockchain;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@Data
@ConfigurationProperties(prefix = "htegaming.blockchain")
public class MetadataConfigurationProperties {
    List<Blockchain> metadata = new ArrayList<>();
}
