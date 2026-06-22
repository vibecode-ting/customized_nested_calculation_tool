export interface RawRow {
  [key: string]: string | number | null | undefined;
}

export interface ProcessedData {
  headers: string[];
  rows: RawRow[];
  sizeColumns: string[]; // Columns treated as numeric quantities
  infoColumns: string[]; // Columns treated as metadata (e.g., Color, Gender)
  soNumbers: string[];
  articleHeader?: string; // Automatically detected Article column
  modelHeader?: string;   // Automatically detected Model column
  colorHeader?: string;   // Automatically detected Color column
}

export interface SavedDataset extends ProcessedData {
  id: string;
  name: string;
  createdAt: number;
}

export interface OrderBreakdownItem {
  orderNo: string;
  qty: number;
  extraInfo?: Record<string, string | number>; // Stores data from infoColumns
}

export interface SizeSummary {
  size: string;
  qty: number;
  orderBreakdown: OrderBreakdownItem[];
  articles: string[]; // Unique articles found for this size
  models: string[];   // Unique models found for this size
  colors: string[];   // Unique colors found for this size
}

export interface NestingResult {
  totalQty: number;
  orderTotals: { orderNo: string; qty: number }[]; // New: Total quantity per order
  breakdown: SizeSummary[];
  infoColumns: string[]; // Pass this through to the result for display purposes
  articleHeader?: string;
  modelHeader?: string;
  colorHeader?: string;
  summaryArticles: string[]; // Grand total distinct articles
  summaryModels: string[];   // Grand total distinct models
  summaryColors: string[];   // Grand total distinct colors
}