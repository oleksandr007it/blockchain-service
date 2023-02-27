package com.netflix.dgs.codegen.generated.types;

import java.lang.Object;
import java.lang.Override;
import java.lang.String;

public class GameContract {
  private String name;

  private String address;

  private String abi;

  public GameContract() {
  }

  public GameContract(String name, String address, String abi) {
    this.name = name;
    this.address = address;
    this.abi = abi;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
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
    return "GameContract{" + "name='" + name + "'," +"address='" + address + "'," +"abi='" + abi + "'" +"}";
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GameContract that = (GameContract) o;
        return java.util.Objects.equals(name, that.name) &&
                            java.util.Objects.equals(address, that.address) &&
                            java.util.Objects.equals(abi, that.abi);
  }

  @Override
  public int hashCode() {
    return java.util.Objects.hash(name, address, abi);
  }

  public static com.netflix.dgs.codegen.generated.types.GameContract.Builder newBuilder() {
    return new Builder();
  }

  public static class Builder {
    private String name;

    private String address;

    private String abi;

    public GameContract build() {
                  com.netflix.dgs.codegen.generated.types.GameContract result = new com.netflix.dgs.codegen.generated.types.GameContract();
                      result.name = this.name;
          result.address = this.address;
          result.abi = this.abi;
                      return result;
    }

    public com.netflix.dgs.codegen.generated.types.GameContract.Builder name(String name) {
      this.name = name;
      return this;
    }

    public com.netflix.dgs.codegen.generated.types.GameContract.Builder address(String address) {
      this.address = address;
      return this;
    }

    public com.netflix.dgs.codegen.generated.types.GameContract.Builder abi(String abi) {
      this.abi = abi;
      return this;
    }
  }
}
