package com.netflix.dgs.codegen.generated.datafetchers;

import com.netflix.dgs.codegen.generated.types.Blockchain;
import com.netflix.graphql.dgs.DgsComponent;
import com.netflix.graphql.dgs.DgsData;
import graphql.schema.DataFetchingEnvironment;
import java.util.List;

@DgsComponent
public class BlockchainMetadataDatafetcher {
  @DgsData(
      parentType = "Query",
      field = "blockchainMetadata"
  )
  public List<Blockchain> getBlockchainMetadata(DataFetchingEnvironment dataFetchingEnvironment) {
    return null;
  }
}
