import { NextRequest, NextResponse } from 'next/server';
import { hashPin, verifyPin, isValidPinFormat } from '@/lib/pin-security';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing PIN Security Functions...');

    // Test 1: PIN Format Validation
    console.log('1. Testing PIN format validation:');
    const formatTests = [
      { pin: '1234', expected: true },
      { pin: '123', expected: false },
      { pin: '12345', expected: false },
      { pin: 'abcd', expected: false }
    ];

    const formatResults = formatTests.map(test => ({
      pin: test.pin,
      isValid: isValidPinFormat(test.pin),
      expected: test.expected,
      passed: isValidPinFormat(test.pin) === test.expected
    }));

    // Test 2: PIN Hashing
    console.log('2. Testing PIN hashing:');
    const testPin = '1111';
    const hashedPin = await hashPin(testPin);
    console.log('   Original PIN:', testPin);
    console.log('   Hashed PIN:', hashedPin);

    // Test 3: PIN Verification
    console.log('3. Testing PIN verification:');
    const isValid = await verifyPin(testPin, hashedPin);
    const isInvalid = await verifyPin('2222', hashedPin);

    // Test 4: Different PINs produce different hashes
    console.log('4. Testing hash uniqueness:');
    const pin1 = '1111';
    const pin2 = '2222';
    const hash1 = await hashPin(pin1);
    const hash2 = await hashPin(pin2);

    const results = {
      formatValidation: formatResults,
      hashing: {
        originalPin: testPin,
        hashedPin: hashedPin,
        hashLength: hashedPin.length
      },
      verification: {
        correctPin: isValid,
        wrongPin: isInvalid
      },
      uniqueness: {
        pin1Hash: hash1.substring(0, 20) + '...',
        pin2Hash: hash2.substring(0, 20) + '...',
        hashesAreDifferent: hash1 !== hash2
      },
      summary: {
        allFormatTestsPassed: formatResults.every(r => r.passed),
        hashingWorks: hashedPin.length > 50,
        verificationWorks: isValid && !isInvalid,
        uniquenessWorks: hash1 !== hash2
      }
    };

    console.log('✅ All PIN security tests completed!');
    console.log('Results:', JSON.stringify(results, null, 2));

    return NextResponse.json({
      success: true,
      message: 'PIN security tests completed',
      results
    });

  } catch (error) {
    console.error('PIN security test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'PIN security test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
