import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from '../logger';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let originalDebug: string | undefined;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Save original DEBUG env
    originalDebug = process.env.DEBUG;
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();

    // Restore DEBUG env
    if (originalDebug === undefined) {
      delete process.env.DEBUG;
    } else {
      process.env.DEBUG = originalDebug;
    }
  });

  it('should log info messages', () => {
    const logger = createLogger();
    logger.info('Test info message');

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const callArg = consoleLogSpy.mock.calls[0][0];
    expect(callArg).toContain('Test info message');
    expect(callArg).toContain('ℹ');
  });

  it('should log success messages', () => {
    const logger = createLogger();
    logger.success('Test success message');

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const callArg = consoleLogSpy.mock.calls[0][0];
    expect(callArg).toContain('Test success message');
    expect(callArg).toContain('✓');
  });

  it('should log warning messages', () => {
    const logger = createLogger();
    logger.warn('Test warning message');

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const callArg = consoleLogSpy.mock.calls[0][0];
    expect(callArg).toContain('Test warning message');
    expect(callArg).toContain('⚠');
  });

  it('should log error messages', () => {
    const logger = createLogger();
    logger.error('Test error message');

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const callArg = consoleErrorSpy.mock.calls[0][0];
    expect(callArg).toContain('Test error message');
    expect(callArg).toContain('✖');
  });

  it('should include timestamp in all log messages', () => {
    const logger = createLogger();

    logger.info('Test message');
    const infoCall = consoleLogSpy.mock.calls[0][0];
    expect(infoCall).toMatch(/\[\d{1,2}:\d{2}:\d{2}/);

    logger.success('Test message');
    const successCall = consoleLogSpy.mock.calls[1][0];
    expect(successCall).toMatch(/\[\d{1,2}:\d{2}:\d{2}/);

    logger.warn('Test message');
    const warnCall = consoleLogSpy.mock.calls[2][0];
    expect(warnCall).toMatch(/\[\d{1,2}:\d{2}:\d{2}/);

    logger.error('Test message');
    const errorCall = consoleErrorSpy.mock.calls[0][0];
    expect(errorCall).toMatch(/\[\d{1,2}:\d{2}:\d{2}/);
  });

  it('should not log debug messages when DEBUG env is not set', () => {
    delete process.env.DEBUG;
    const logger = createLogger();

    logger.debug('Test debug message');

    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should log debug messages when DEBUG env is set', () => {
    process.env.DEBUG = 'true';
    const logger = createLogger();

    logger.debug('Test debug message');

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const callArg = consoleLogSpy.mock.calls[0][0];
    expect(callArg).toContain('Test debug message');
    expect(callArg).toContain('[DEBUG]');
  });

  it('should use ANSI color codes', () => {
    const logger = createLogger();

    logger.info('Test');
    const infoCall = consoleLogSpy.mock.calls[0][0];
    // Should contain ANSI escape sequences
    expect(infoCall).toMatch(/\x1b\[\d+m/);
  });

  it('should handle multiple log calls', () => {
    const logger = createLogger();

    logger.info('Message 1');
    logger.success('Message 2');
    logger.warn('Message 3');

    expect(consoleLogSpy).toHaveBeenCalledTimes(3);
    expect(consoleLogSpy.mock.calls[0][0]).toContain('Message 1');
    expect(consoleLogSpy.mock.calls[1][0]).toContain('Message 2');
    expect(consoleLogSpy.mock.calls[2][0]).toContain('Message 3');
  });

  it('should handle empty messages', () => {
    const logger = createLogger();

    logger.info('');
    logger.success('');
    logger.warn('');
    logger.error('');

    expect(consoleLogSpy).toHaveBeenCalledTimes(3);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle messages with special characters', () => {
    const logger = createLogger();

    const specialMessage = 'Test with 特殊字符 and émojis 🎉';
    logger.info(specialMessage);

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const callArg = consoleLogSpy.mock.calls[0][0];
    expect(callArg).toContain(specialMessage);
  });

  it('should handle multi-line messages', () => {
    const logger = createLogger();

    const multiLineMessage = 'Line 1\nLine 2\nLine 3';
    logger.info(multiLineMessage);

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const callArg = consoleLogSpy.mock.calls[0][0];
    expect(callArg).toContain('Line 1');
    expect(callArg).toContain('Line 2');
    expect(callArg).toContain('Line 3');
  });
});
