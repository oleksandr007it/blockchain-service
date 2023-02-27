package com.htegaming.metadata.api.graphql;

import com.htegaming.metadata.service.MetadataService;
import com.netflix.dgs.codegen.generated.types.Blockchain;
import com.netflix.graphql.dgs.DgsComponent;
import com.netflix.graphql.dgs.DgsQuery;
import com.netflix.graphql.dgs.InputArgument;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@DgsComponent
@RequiredArgsConstructor
public class MetadataQueryResolver {

    private final MetadataService service;

    @DgsQuery
    public List<Blockchain> blockchainMetadata(@InputArgument String blockchainCode) {
        if (blockchainCode != null) {
            return service.getMetadata(blockchainCode)
                    .map(List::of)
                    .orElse(new ArrayList<>());
        } else {
            return service.getMetadata();
        }

    }

}
