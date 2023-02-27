package com.netflix.dgs.codegen.generated.types;

import java.lang.Object;
import java.lang.Override;
import java.lang.String;

public class BetslipContract {
  private String address;

  private String abi;

  public BetslipContract() {
  }

  public BetslipContract(String address, String abi) {
    this.address = address;
    this.abi = abi;
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
  }

  public String getAbi() {
    return abi;
  }

  public void setAbi(String abi) {
    this.abi = abi;
  }

  @Override
  public String toString() {
    return "BetslipContract{" + "address='" + address + "'," +"abi='" + abi + "'" +"}";
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BetslipContract that = (BetslipContract) o;
        return java.util.Objects.equals(address, that.address) &&
                            java.util.Objects.equals(abi, that.abi);
  }

  @Override
  public int hashCode() {
    return java.util.Objects.hash(address, abi);
  }

  public static com.netflix.dgs.codegen.generated.types.BetslipContract.Builder newBuilder() {
    return new Builder();
  }

  public static class Builder {
    private String address;

    private String abi;

    public BetslipContract build() {
                  com.netflix.dgs.codegen.generated.types.BetslipContract result = new com.netflix.dgs.codegen.generated.types.BetslipContract();
                      result.address = this.address;
          result.abi = this.abi;
                      return result;
    }

    public com.netflix.dgs.codegen.generated.types.BetslipContract.Builder address(String address) {
      this.address = address;
      return this;
    }

    public com.netflix.dgs.codegen.generated.types.BetslipContract.Builder abi(String abi) {
      this.abi = abi;
      return this;
    }
  }
}
