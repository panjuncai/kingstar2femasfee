// 解析所有费率和费额字段，处理格式和默认值
const parseRate = (row, fieldName) => {
  if (row[fieldName] === undefined || row[fieldName] === null) return 0;
  // 处理百分比值，去除逗号，转换为小数
  const strValue = String(row[fieldName]).replace(/,/g, '');
  const value = parseFloat(strValue);
  return isNaN(value) ? 0 : value;
};

const parseAmount = (row, fieldName) => {
  if (row[fieldName] === undefined || row[fieldName] === null) return 0;
  // 处理费额，去除逗号等格式符号
  const strValue = String(row[fieldName]).replace(/,/g, '');
  const value = parseFloat(strValue);
  return isNaN(value) ? 0 : value;
};

module.exports = {
  parseRate,
  parseAmount,
};
