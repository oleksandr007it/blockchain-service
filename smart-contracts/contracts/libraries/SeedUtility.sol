// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

library SeedUtility {
    //Fraction is literally the number expressed as a quotient, in which the numerator is divided by the denominator. 
    //Because solidity doesn't support decimal data, fraction is needed for dealing with deciaml data operation.
    //Thus, decimal data is converted into fraction data.
    struct Fraction {
        uint256 numerator;
        uint256 denominator;
    }

    function bytes32ToString(bytes32 _bytes32)
        public
        pure
        returns (string memory)
    {
        bytes memory s = new bytes(64);

        for (uint8 i = 0; i < 32; i++) {
            bytes1 b = bytes1(_bytes32[i]);
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));

            if (hi < 0x0A) {
                s[i * 2] = bytes1(uint8(hi) + 0x30);
            } else {
                s[i * 2] = bytes1(uint8(hi) + 0x57);
            }

            if (lo < 0x0A) {
                s[i * 2 + 1] = bytes1(uint8(lo) + 0x30);
            } else {
                s[i * 2 + 1] = bytes1(uint8(lo) + 0x57);
            }
        }

        return string(s);
    }

    function strToUint(string memory _str) public pure returns (uint256 res) {
        uint64 val = 0;
        uint8 a = uint8(97); // a
        uint8 zero = uint8(48); //0
        uint8 nine = uint8(57); //9
        uint8 A = uint8(65); //A
        uint8 F = uint8(70); //F
        uint8 f = uint8(102); //f

        for (uint256 i = 0; i < bytes(_str).length; i++) {
            uint8 byt = uint8(bytes(_str)[i]);
            if (byt >= zero && byt <= nine) byt = byt - zero;
            else if (byt >= a && byt <= f) byt = byt - a + 10;
            else if (byt >= A && byt <= F) byt = byt - A + 10;
            val = (val << 4) | (byt & 0xF);
        }

        return val;
    }

    function uintToStr(uint256 _i)
        public
        pure
        returns (string memory _uintAsString)
    {
        uint256 number = _i;
        if (number == 0) {
            return "0";
        }
        uint256 j = number;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }

        bytes memory bstr = new bytes(len);
        uint256 k = len - 1;
        while (number >= 10) {
            bstr[k--] = bytes1(uint8(48 + (number % 10)));
            number /= 10;
        }
        bstr[k] = bytes1(uint8(48 + (number % 10)));
        return string(bstr);
    }

    function addressToStr(address _address)
        public
        pure
        returns (string memory)
    {
        bytes32 _bytes = bytes32((uint256(uint160(_address))));
        bytes memory HEX = "0123456789abcdef";
        bytes memory _string = new bytes(42);

        _string[0] = "0";
        _string[1] = "x";

        for (uint256 i = 0; i < 20; i++) {
            _string[2 + i * 2] = HEX[uint8(_bytes[i + 12] >> 4)];
            _string[3 + i * 2] = HEX[uint8(_bytes[i + 12] & 0x0f)];
        }

        return string(_string);
    }

    function compareSeed(string memory seedHash, string memory seed)
        public
        pure
        returns (bool)
    {
        string memory hash = bytes32ToString(sha256(abi.encodePacked(seed)));

        if (
            keccak256(abi.encodePacked(hash)) ==
            keccak256(abi.encodePacked(seedHash))
        ) {
            return true;
        } else {
            return false;
        }
    }

    function getHashNumberUsingAsciiNumber(string memory asciiNumbers)
        public
        pure
        returns (uint256)
    {
        bytes memory b = bytes(asciiNumbers);
        uint256 sum = 0;

        for (uint256 i = 0; i < b.length; i++) {
            bytes1 char = b[i];

            sum += uint256(uint8(char));
        }

        return sum;
    }

    function abs(int256 x) 
        public 
        pure 
        returns (int256) 
    {
       return x >= 0 ? x : -x;
    }

    function getHashNumber(string memory seed)
        public
        pure
        returns (uint256)
    {
        int256 p = 31;
        int256 m = 10 ** 9 + 9;
        int256 powerOfP = 1;
        int256 hashVal = 0;
        bytes memory b = bytes(seed);
        bytes1 ascciNumberOfA = 'a';

        for (uint256 i = 0; i < b.length; i++) {
            bytes1 char = b[i];
            hashVal = (hashVal + int256(int8(uint8(char)) - int8(uint8(ascciNumberOfA)) + 1) * powerOfP) % m;
            powerOfP = (powerOfP * p) % m;
        }

        return uint256(abs(hashVal));
    }

    function getResultByProbabilities(string memory seed, uint256[] memory probabilities, uint256 amountOfDigits)
        public
        pure
        returns (uint256 index)
    {
        uint256 totalProbabilities = 0;
        uint256 amountOfResultItems = probabilities.length;

        // The value generated by getHashNumber is one that has 9 digits integer.
        // hitNumber is integer that amount of digits of aboved integer from the lowest digit.
        uint256 hitNumber = getHashNumber(seed) % (10**amountOfDigits);

        for(index = 0; index < amountOfResultItems; index++)
        {
            totalProbabilities += probabilities[index];
            
            if (totalProbabilities > hitNumber)
            {
                return index;
            }
        }
    }

    function getResultByFractionProbabilities(string memory seed, Fraction[] memory probabilities, uint256 amountOfDigits)
        public
        pure
        returns (uint256 index)
    {
        uint256 amountOfResultItems = probabilities.length;

        Fraction memory totalProbabilities;
        totalProbabilities.numerator = 0;
        totalProbabilities.denominator = 1;

        // The value generated by getHashNumber is one that has 9 digits integer.
        // hitNumber is integer that has amount of digits(amountOfDigits) from the lowest digit.
        uint256 hitNumber = getHashNumber(seed) % (10**amountOfDigits);

        for(index = 0; index < amountOfResultItems; index++)
        {
            totalProbabilities = fractionAddFraction(totalProbabilities, probabilities[index]);
            
            if ((totalProbabilities.numerator / totalProbabilities.denominator) > hitNumber)
            {
                return index;
            }
        }
    }

    function fractionMultInteger(Fraction memory fraction, uint256 integer)
        public
        pure
        returns (Fraction memory result)
    {
        result.numerator = fraction.numerator * integer;
        result.denominator = fraction.denominator;
    }

    function fractionDivInteger(Fraction memory fraction, uint256 integer)
        public
        pure
        returns (Fraction memory result)
    {
        result.numerator = fraction.numerator;
        result.denominator = fraction.denominator * integer;
    }

    function fractionAddFraction(Fraction memory fraction1, Fraction memory fraction2)
        public
        pure
        returns (Fraction memory result)
    {
        result.numerator = fraction1.numerator*fraction2.denominator + fraction2.numerator*fraction1.denominator;
        result.denominator = fraction1.denominator * fraction2.denominator;
    }

    function fractionDivFraction(Fraction memory fraction1, Fraction memory fraction2)
        public
        pure
        returns (Fraction memory result)
    {
        result.numerator = fraction1.numerator*fraction2.denominator;
        result.denominator = fraction1.denominator * fraction2.numerator;
    }

    function toJsonStrArray(string [] memory arr)
        public 
        pure
        returns (string memory)
    {
        string memory jsonStrArray;
        for (uint8 i = 0; i < arr.length; i++) {
            if (i == 0)
                jsonStrArray = string(abi.encodePacked('["', arr[i], '"'));
            else
                jsonStrArray = string(abi.encodePacked(jsonStrArray, ', "', arr[i], '"'));
        }
        jsonStrArray = string(abi.encodePacked(jsonStrArray, ']'));

        return jsonStrArray;
    }

    function toStrArray(string [] memory arr)
        public 
        pure
        returns (string memory)
    {
        string memory strArray;
        for (uint8 i = 0; i < arr.length; i++) {
            if (i == 0)
                strArray = string(abi.encodePacked("[", arr[i]));
            else
                strArray = string(abi.encodePacked(strArray, ", ", arr[i]));
        }
        strArray = string(abi.encodePacked(strArray, "]"));

        return strArray;
    }

    function substring(string memory str, uint startIndex, uint endIndex) 
        public 
        pure 
        returns (string memory ) 
    {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex-startIndex);
        for(uint i = startIndex; i < endIndex; i++) {
            result[i-startIndex] = strBytes[i];
        }
        return string(result);
    }
}
