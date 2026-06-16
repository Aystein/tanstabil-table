interface BoxPlotStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
}

export function calculateBoxPlotStats(data: Array<number | undefined>): BoxPlotStats | undefined {
  const finiteValues = data.filter((value): value is number => Number.isFinite(value));

  if (finiteValues.length === 0) {
    return undefined;
  }

  const sorted = [...finiteValues].sort((a, b) => a - b);

  const getMedian = (arr: number[]): number => {
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  };

  if (sorted.length === 1) {
    const [value] = sorted;

    return {
      min: value,
      q1: value,
      median: value,
      q3: value,
      max: value,
      outliers: [],
    };
  }

  const median = getMedian(sorted);

  const midIndex = Math.floor(sorted.length / 2);
  const lowerHalf = sorted.slice(0, midIndex);
  const upperHalf = sorted.length % 2 === 0 ? sorted.slice(midIndex) : sorted.slice(midIndex + 1);

  const q1 = getMedian(lowerHalf);
  const q3 = getMedian(upperHalf);

  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers = sorted.filter((x) => x < lowerBound || x > upperBound);
  const nonOutliers = sorted.filter((x) => x >= lowerBound && x <= upperBound);

  return {
    min: nonOutliers[0], // Whisker end
    q1,
    median,
    q3,
    max: nonOutliers[nonOutliers.length - 1], // Whisker end
    outliers,
  };
}
