import { NextRequest, NextResponse } from "next/server";
import { hashPin, verifyPin, isValidPinFormat } from "@/lib/pin-security";

export async function GET(request: NextRequest) {
  try {
    const formatTests = [
      { pin: "1234", expected: true },
      { pin: "123", expected: false },
      { pin: "12345", expected: false },
      { pin: "abcd", expected: false },
    ];

    const formatResults = formatTests.map((test) => ({
      pin: test.pin,
      isValid: isValidPinFormat(test.pin),
      expected: test.expected,
      passed: isValidPinFormat(test.pin) === test.expected,
    }));

    // Test 2: PIN Hashing
    const testPin = "1234";
    const hashedPin = await hashPin(testPin);
    const hash1 = hashedPin;

    // Test 3: PIN Verification
    const isValid = await verifyPin(testPin, hashedPin);
    const isInvalid = await verifyPin("2222", hashedPin);

    // Test 4: Different PINs produce different hashes
    const pin2 = "5678";
    const hash2 = await hashPin(pin2);

    const results = {
      formatValidation: formatResults,
      hashing: {
        originalPin: testPin,
        hashedPin: hashedPin,
        hashLength: hashedPin.length,
      },
      verification: {
        correctPin: isValid,
        wrongPin: isInvalid,
      },
      uniqueness: {
        pin1Hash: hash1.substring(0, 20) + "...",
        pin2Hash: hash2.substring(0, 20) + "...",
        hashesAreDifferent: hash1 !== hash2,
      },
      summary: {
        allFormatTestsPassed: formatResults.every((r) => r.passed),
        hashingWorks: hashedPin.length > 50,
        verificationWorks: isValid && !isInvalid,
        uniquenessWorks: hash1 !== hash2,
      },
    };

    return NextResponse.json({
      success: true,
      message: "PIN security tests completed",
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Error running PIN security tests",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
