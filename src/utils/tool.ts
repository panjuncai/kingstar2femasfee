// 比较费率值（精度：8位小数）
export const compareRate = (value1: number, value2: number): boolean => {
  const diff = Math.abs(value1 - value2);
  return diff <= 0.000000001; // 容许极小的误差
};

// 比较费额值（精度：2位小数）
export const compareAmount = (value1: number, value2: number): boolean => {
  const diff = Math.abs(value1 - value2);
  return diff <= 0.000001; // 容许很小的误差
};
