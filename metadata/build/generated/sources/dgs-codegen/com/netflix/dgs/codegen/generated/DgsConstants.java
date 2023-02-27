package com.netflix.dgs.codegen.generated;

import java.lang.String;

public class DgsConstants {
  public static final String QUERY_TYPE = "Query";

  public static class QUERY {
    public static final String TYPE_NAME = "Query";

    public static final String BlockchainMetadata = "blockchainMetadata";
  }

  public static class BLOCKCHAIN {
    public static final String TYPE_NAME = "Blockchain";

    public static final String Id = "id";

    public static final String Code = "code";

    public static final String Name = "name";

    public static final String RpcUrl = "rpcUrl";

    public static final String ExplorerUrl = "explorerUrl";

    public static final String Tokens = "tokens";

    public static final String Games = "games";

    public static final String Betslip = "betslip";
  }

  public static class GAMECONTRACT {
    public static final String TYPE_NAME = "GameContract";

    public static final String Name = "name";

    public static final String Address = "address";

    public static final String Abi = "abi";
  }

  public static class BETSLIPCONTRACT {
    public static final String TYPE_NAME = "BetslipContract";

    public static final String Address = "address";

    public static final String Abi = "abi";
  }

  public static class TOKEN {
    public static final String TYPE_NAME = "Token";

    public static final String Symbol = "symbol";

    public static final String Digits = "digits";

    public static final String Type = "type";

    public static final String Address = "address";

    public static final String Abi = "abi";
  }
}
