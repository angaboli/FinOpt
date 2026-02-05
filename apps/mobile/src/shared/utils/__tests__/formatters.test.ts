import {
  formatCurrency,
  formatDate,
  formatPercentage,
  formatRelativeDate,
} from '../formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format positive amount correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format negative amount correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should support different currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
    });

    it('should handle small decimal values', () => {
      expect(formatCurrency(0.99)).toBe('$0.99');
    });
  });

  describe('formatDate', () => {
    it('should format date in long format', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      expect(formatDate(date)).toBe('Jan 15, 2024');
    });

    it('should format date in short format', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      expect(formatDate(date, 'short')).toBe('01/15/2024');
    });

    it('should handle different years', () => {
      const date = new Date('2023-12-31T12:00:00Z');
      expect(formatDate(date)).toBe('Dec 31, 2023');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with default decimals', () => {
      expect(formatPercentage(0.5)).toBe('50.00%');
    });

    it('should format percentage with custom decimals', () => {
      expect(formatPercentage(0.333, 1)).toBe('33.3%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.00%');
    });

    it('should handle negative percentages', () => {
      expect(formatPercentage(-0.25)).toBe('-25.00%');
    });

    it('should handle values over 100%', () => {
      expect(formatPercentage(1.5)).toBe('150.00%');
    });
  });

  describe('formatRelativeDate', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should return "Today" for current date', () => {
      const today = new Date('2024-01-15T10:00:00Z');
      expect(formatRelativeDate(today)).toBe('Today');
    });

    it('should return "Yesterday" for previous day', () => {
      const yesterday = new Date('2024-01-14T10:00:00Z');
      expect(formatRelativeDate(yesterday)).toBe('Yesterday');
    });

    it('should return formatted date for older dates', () => {
      const older = new Date('2024-01-10T10:00:00Z');
      expect(formatRelativeDate(older)).toBe('Jan 10');
    });

    it('should include year for dates from different year', () => {
      const lastYear = new Date('2023-12-25T10:00:00Z');
      expect(formatRelativeDate(lastYear)).toBe('Dec 25, 2023');
    });
  });
});
