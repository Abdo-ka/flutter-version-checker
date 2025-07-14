const { incrementVersion, parseFlutterVersion } = require('./auto-increment-version');

describe('Auto-Increment Version Tests', () => {
  describe('parseFlutterVersion', () => {
    test('should parse version with build number', () => {
      const result = parseFlutterVersion('1.0.1+2');
      expect(result).toEqual({
        major: 1,
        minor: 0,
        patch: 1,
        build: 2,
        base: '1.0.1',
        full: '1.0.1+2'
      });
    });

    test('should parse version without build number', () => {
      const result = parseFlutterVersion('2.1.0');
      expect(result).toEqual({
        major: 2,
        minor: 1,
        patch: 0,
        build: 0,
        base: '2.1.0',
        full: '2.1.0'
      });
    });

    test('should handle null/undefined input', () => {
      expect(parseFlutterVersion(null)).toBeNull();
      expect(parseFlutterVersion(undefined)).toBeNull();
      expect(parseFlutterVersion('')).toBeNull();
    });
  });

  describe('incrementVersion', () => {
    test('should increment patch and build number when no previous version', () => {
      expect(incrementVersion('1.0.1+2')).toBe('1.0.2+3');
      expect(incrementVersion('2.1.0+5')).toBe('2.1.1+6');
      expect(incrementVersion('0.0.1+1')).toBe('0.0.2+2');
    });

    test('should only increment build number when patch already incremented', () => {
      expect(incrementVersion('1.0.7+6', '1.0.6+6')).toBe('1.0.7+7');
      expect(incrementVersion('2.1.1+3', '2.1.0+5')).toBe('2.1.1+4');
      expect(incrementVersion('1.1.0+2', '1.0.9+8')).toBe('1.1.0+3');
    });

    test('should increment patch and build when versions are the same', () => {
      expect(incrementVersion('1.0.7+6', '1.0.7+6')).toBe('1.0.8+7');
      expect(incrementVersion('2.1.1+3', '2.1.1+3')).toBe('2.1.2+4');
    });

    test('should handle version without build number', () => {
      expect(incrementVersion('1.0.1')).toBe('1.0.2+1');
      expect(incrementVersion('1.0.2+0', '1.0.1+5')).toBe('1.0.2+1');
    });

    test('should handle invalid input', () => {
      expect(incrementVersion(null)).toBe('1.0.0+1');
      expect(incrementVersion('')).toBe('1.0.0+1');
    });

    test('should handle edge cases', () => {
      expect(incrementVersion('0.0.0+0')).toBe('0.0.1+1');
      expect(incrementVersion('999.999.999+999')).toBe('999.999.1000+1000');
      // When major version incremented, only increment build
      expect(incrementVersion('2.0.0+1', '1.9.9+5')).toBe('2.0.0+2');
    });
  });
});
