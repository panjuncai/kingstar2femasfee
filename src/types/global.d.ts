import { ExchangeFeeItem } from './exchangeFee';
import { Result } from './result';

declare global {
  interface Window {
    electronAPI: {
      importExcel: () => Promise<Result<string>>;
      queryExchangeFees: () => Promise<Result<Array<ExchangeFeeItem>>>;
      clearExchangeTradeFee: () => Promise<Result<void>>;
      readReadme: () => Promise<Result<string>>;
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
}
