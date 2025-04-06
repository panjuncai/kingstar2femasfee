// 为Electron API添加类型定义
interface ElectronAPI {
  importExcel: () => Promise<{ success: boolean; message?: string }>;
  queryExchangeFees: () => Promise<{
    success: boolean;
    data?: Array<{
      exch_code: string;
      product_type: string;
      product_id: string;
      instrument_id: string;
      open_amt: number;
      open_rate: number;
    }>;
    message?: string;
  }>;
  clearExchangeFees: () => Promise<{ success: boolean; message?: string }>;
}

interface Window {
  electronAPI: ElectronAPI;
}
