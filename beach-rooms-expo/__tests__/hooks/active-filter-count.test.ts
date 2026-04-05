// Test the active filter count logic used in the home screen

function calculateActiveFilterCount(
  selectedTime: Date | null,
  sortByDistance: boolean,
  locationEnabled: boolean
): number {
  return (selectedTime !== null ? 1 : 0) + (sortByDistance && locationEnabled ? 1 : 0);
}

describe('Active Filter Count', () => {
  describe('time filter', () => {
    it('returns 0 when no time is selected and distance sorting is off', () => {
      const count = calculateActiveFilterCount(null, false, true);
      expect(count).toBe(0);
    });

    it('returns 1 when time is selected', () => {
      const count = calculateActiveFilterCount(new Date(), false, true);
      expect(count).toBe(1);
    });
  });

  describe('distance sorting', () => {
    it('returns 1 when distance sorting is enabled and location is granted', () => {
      const count = calculateActiveFilterCount(null, true, true);
      expect(count).toBe(1);
    });

    it('returns 0 when distance sorting is enabled but location is not granted', () => {
      const count = calculateActiveFilterCount(null, true, false);
      expect(count).toBe(0);
    });

    it('returns 0 when distance sorting is disabled', () => {
      const count = calculateActiveFilterCount(null, false, true);
      expect(count).toBe(0);
    });
  });

  describe('combined filters', () => {
    it('returns 2 when both time is selected and distance sorting is active', () => {
      const count = calculateActiveFilterCount(new Date(), true, true);
      expect(count).toBe(2);
    });

    it('returns 1 when time is selected but distance sorting has no location', () => {
      const count = calculateActiveFilterCount(new Date(), true, false);
      expect(count).toBe(1);
    });

    it('returns 1 when time is selected and distance sorting is disabled', () => {
      const count = calculateActiveFilterCount(new Date(), false, true);
      expect(count).toBe(1);
    });
  });
});
