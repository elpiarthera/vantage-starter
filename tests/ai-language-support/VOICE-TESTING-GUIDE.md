# Voice Generation Comprehensive Testing

## Overview

The comprehensive voice testing infrastructure has been created to test ALL voice models with ALL parameter variations.

## Test Scripts

### 1. Quick Test (`test-voice-generation.ts`)
- **Purpose**: Fast sanity checks for CI/CD
- **Coverage**: Default parameters only
- **Runtime**: ~30 seconds per language
- **Usage**: `npx tsx tests/ai-language-support/test-voice-generation.ts --lang=fr`

### 2. Comprehensive Test (`test-voice-generation-comprehensive.ts`) ⭐
- **Purpose**: Full parameter validation
- **Coverage**: ALL basic + advanced parameters
- **Runtime**: ~30-45 minutes per language
- **Cost**: ~$0.27 per language
- **Usage**: `npx tsx tests/ai-language-support/test-voice-generation-comprehensive.ts --lang=fr`

## Test Coverage

### MiniMax Speech 2.8 HD (9 tests)

**Basic Parameters (7 tests):**
1. Default baseline (speed: 1.0, pitch: 0, emotion: neutral)
2. Fast speech (speed: 1.5x)
3. Slow speech (speed: 0.7x)
4. Higher pitch (+5)
5. Lower pitch (-5)
6. Happy emotion
7. Male voice (Deep_Voice_Man)

**Advanced Parameters (2 tests):**
8. English normalization ON
9. Auto language detection

### MiniMax Speech 2.8 Turbo (9 tests)
Same as HD (to compare quality vs speed trade-off)

### Qwen 3 TTS (8 tests)

**Basic Parameters (3 tests):**
1. Default baseline
2. Male voice (Dylan)
3. With style prompt ("warm, romantic, emotional tone")

**Advanced ML Parameters (5 tests):**
4. Low temperature (0.5) - more deterministic
5. High temperature (1.0) - more creative
6. Low top_k (20) - limited vocab sampling
7. High top_p (0.95) - nucleus sampling
8. High repetition penalty (1.3) - avoid repetition

## Total Tests Per Language

- **MiniMax HD**: 9 tests
- **MiniMax Turbo**: 9 tests  
- **Qwen 3 TTS**: 8 tests
- **Total**: 26 tests per language

## Output Files

### Per-Language Results
Location: `tests/ai-language-support/results/comprehensive/`

**1. Comprehensive Test Results**
- File: `comprehensive-voice-test-{lang}-{date}.json`
- Contains:
  - Full test results for all 26 variations
  - Success/failure status per test
  - Latency measurements
  - Complete payloads sent to API
  - Error messages (if any)
  - Summary statistics

**2. Audio URLs**
- File: `audio-urls-{lang}-{date}.json`
- Contains:
  - List of all successful audio generations
  - Direct URLs for manual quality review
  - Test name and category for each audio
  - Model name for each audio

## Manual Quality Review Checklist

For each generated audio file, verify:

### Basic Quality
- [ ] Audio plays without errors
- [ ] Speech is clear and understandable
- [ ] No distortion or artifacts
- [ ] Appropriate volume level

### Language-Specific
- [ ] Correct pronunciation of language-specific sounds
- [ ] Natural intonation and rhythm
- [ ] Proper handling of special characters/accents
- [ ] Fluency (not robotic)

### Parameter Variations
- [ ] Speed variations are audibly different (0.7x vs 1.5x)
- [ ] Pitch variations are noticeable (-5 vs +5)
- [ ] Emotions are expressed appropriately
- [ ] Voice changes are distinct (male vs female)

### Advanced Parameters (Qwen)
- [ ] Temperature affects voice variation/creativity
- [ ] Style prompts influence tone appropriately
- [ ] No excessive repetition with high penalty

## Interpreting Results

### Success Rates
- **90-100%**: Excellent - Model ready for production
- **80-89%**: Good - Minor issues, investigate failures
- **70-79%**: Fair - Significant issues, review failed tests
- **<70%**: Poor - Major problems, may not be production-ready

### Latency Guidelines
- **< 5s**: Excellent for real-time use
- **5-10s**: Good for async generation
- **10-15s**: Acceptable for batch processing
- **> 15s**: Slow - consider faster model (Turbo vs HD)

### Category Analysis
- **Basic failures**: Fundamental issues with the model
- **Advanced failures**: ML parameter tuning issues (less critical)

## Example Commands

```bash
# Test French comprehensively
npx tsx tests/ai-language-support/test-voice-generation-comprehensive.ts --lang=fr

# Test all languages (will take several hours!)
npx tsx tests/ai-language-support/test-voice-generation-comprehensive.ts --lang=all

# Quick sanity test for CI/CD
npx tsx tests/ai-language-support/test-voice-generation.ts --lang=fr --model=minimax
```

## CI/CD Integration

### Recommended Workflow

**Pre-deployment (Quick Test)**:
```bash
# Run quick test on main languages (5-10 min)
npx tsx tests/ai-language-support/test-voice-generation.ts --lang=fr
npx tsx tests/ai-language-support/test-voice-generation.ts --lang=de
npx tsx tests/ai-language-support/test-voice-generation.ts --lang=es
```

**Monthly Full Audit (Comprehensive Test)**:
```bash
# Run comprehensive test on all languages (3-4 hours)
npx tsx tests/ai-language-support/test-voice-generation-comprehensive.ts --lang=all
```

## Cost Estimates

### Per Test Costs (fal.ai pricing)
- MiniMax HD: ~$0.01 per generation
- MiniMax Turbo: ~$0.005 per generation
- Qwen 3 TTS: ~$0.01 per generation

### Total Costs
- **Quick test** (1 lang): ~$0.03
- **Comprehensive test** (1 lang): ~$0.27
- **Full audit** (all 7 languages): ~$1.89

## Known Limitations

1. **Quality scoring is manual** - Script marks success/failure based on API response, but audio quality requires human review
2. **No automatic pronunciation verification** - Cannot automatically detect mispronunciations
3. **Rate limiting** - 3-second delay between tests to respect API limits
4. **Long runtime** - Comprehensive tests take 30-45 minutes per language

## Future Enhancements

- [ ] Automatic audio quality scoring using ML
- [ ] Pronunciation accuracy detection
- [ ] SSML support testing
- [ ] Voice cloning feature tests (Qwen)
- [ ] Parallel test execution (with rate limit management)
- [ ] Automated regression detection
