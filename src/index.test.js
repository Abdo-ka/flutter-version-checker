const { parseFlutterVersion, compareVersions, generateNextVersion } = require('../src/index');

describe('Flutter Version Checker', () => {
  describe('parseFlutterVersion', () => {
    test('should parse valid version strings', () => {
      const version = parseFlutterVersion('50.8.47+177');
      expect(version).toEqual({
        major: 50,
        minor: 8,
        patch: 47,
        build: 177,
        base: '50.8.47',
        full: '50.8.47+177'
      });
    });
    
    test('should handle version without build number', () => {
      const version = parseFlutterVersion('1.2.3');
      expect(version).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        build: 0,
        base: '1.2.3',
        full: '1.2.3'
      });
    });
    
    test('should return null for invalid version', () => {
      expect(parseFlutterVersion('')).toBeNull();
      expect(parseFlutterVersion(null)).toBeNull();
    });
  });
  
  describe('compareVersions', () => {
    test('should detect version increase in base version', () => {
      expect(compareVersions('50.8.48+178', '50.8.47+177')).toBe(1);
      expect(compareVersions('50.9.0+1', '50.8.47+177')).toBe(1);
      expect(compareVersions('51.0.0+1', '50.8.47+177')).toBe(1);
    });
    
    test('should detect version increase in build number', () => {
      expect(compareVersions('50.8.47+178', '50.8.47+177')).toBe(1);
    });
    
    test('should detect same versions', () => {
      expect(compareVersions('50.8.47+177', '50.8.47+177')).toBe(0);
    });
    
    test('should detect version decrease', () => {
      expect(compareVersions('50.8.47+177', '50.8.48+178')).toBe(-1);
      expect(compareVersions('50.8.47+176', '50.8.47+177')).toBe(-1);
    });
  });
  
  describe('generateNextVersion', () => {
    test('should increment patch and build number', () => {
      expect(generateNextVersion('50.8.47+177')).toBe('50.8.48+178');
    });
    
    test('should handle version without build number', () => {
      expect(generateNextVersion('1.2.3')).toBe('1.2.4+1');
    });
    
    test('should handle null/invalid input', () => {
      expect(generateNextVersion(null)).toBe('1.0.0+1');
      expect(generateNextVersion('')).toBe('1.0.0+1');
    });
  });
});
