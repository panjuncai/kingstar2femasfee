interface Window {
  electronAPI: {
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
    readReadme: () => Promise<{
      success: boolean;
      data: string;
      message?: string;
    }>;
    execSql: (sql: string) => Promise<{
      success: boolean;
      data?: Array<Record<string, any>>;
      columnNames?: string[];
      rowCount?: number;
      message?: string;
      sql?: string;
    }>;
  };
}
