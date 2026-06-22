import * as XLSX from 'xlsx';
import { ProcessedData, RawRow } from '../types';

export const parseExcelFile = async (file: File): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawJson = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
        
        if (!rawJson || rawJson.length === 0) {
          reject(new Error("File is empty or could not be read."));
          return;
        }

        // Locate the header row.
        let headerRowIndex = -1;
        let headers: string[] = [];
        
        // Expanded Regex to catch standard and SAP-specific headers
        // Matches: "Order No", "Sales Order", "SO Number", "Sales Doc", "Sales Document", "SD Doc", "PO Number"
        const orderHeaderRegex = /(Order\s*N[oO])|(Sale(s)?\s*Order)|(SO\s*Number)|(S\/O)|(Sales\s*Doc)|(SD\s*Doc)|(Purch(\.)?\s*Order)|(PO\s*Number)|(Document\s*No)/i;

        // Expanded heuristic: find row containing Order Number variants.
        // Scans up to 50 rows to account for SAP reports with many metadata rows at the top.
        for (let i = 0; i < Math.min(rawJson.length, 50); i++) {
           const row = rawJson[i];
           if (row && Array.isArray(row) && row.some(cell => cell && String(cell).match(orderHeaderRegex))) {
             headerRowIndex = i;
             headers = row;
             break;
           }
        }
        
        if (headerRowIndex === -1) {
            reject(new Error("Header Not Found: Could not find a column for Order Number (e.g., 'Order No', 'Sales Doc', 'SO Number') in the first 50 rows. Please verify your Excel header row."));
            return;
        }

        // Clean Headers & ensure uniqueness
        const usedHeaders = new Set<string>();
        const cleanHeaders = headers.map(h => {
            let base = h ? String(h).trim() : `Col`;
            
            // Standardize SO Number column for internal use
            if (base.match(orderHeaderRegex)) base = 'SO_Number';

            // Handle duplicates
            let unique = base;
            let counter = 1;
            while (usedHeaders.has(unique)) {
                unique = `${base}_${counter++}`;
            }
            usedHeaders.add(unique);
            return unique;
        });

        const rawRows = rawJson.slice(headerRowIndex + 1);
        const rows: RawRow[] = rawRows.map(row => {
            const obj: RawRow = {};
            cleanHeaders.forEach((header, index) => {
                obj[header] = row[index];
            });
            return obj;
        });

        if (rows.length === 0) {
             reject(new Error("No Data Rows: The file contains a header but no data rows underneath."));
             return;
        }

        // --- Improved Size Column Detection Logic ---
        const suggestedSizeColumns = cleanHeaders.filter(header => {
            if (!header) return false;
            const h = header;
            const lowerH = h.toLowerCase();

            // 1. Hard Exclusion: Metadata columns
            const excludeKeywords = [
                'total', 'qty', 'quantity', 'order', 'so_number', 'po', 
                'article', 'model', 'color', 'colour', 
                '型號', '型體', '顏色', '色名', 'gender', 'remark', 'date', 'customer', 'season', 'price', 'amount', 'doc',
                // Added specific exclusions to prevent false positives
                'status', 'plant', 'loc', 'category', 'group', 'desc', 'material', 'segment', 'type', 'name'
            ];
            
            if (excludeKeywords.some(ex => lowerH.includes(ex))) return false;

            // 2. Candidate Identification (Name-based)
            let isCandidate = false;

            // Rule A: Explicit "Size" keyword or Country codes (UK, US, EUR)
            // Use word boundaries \b to ensure we don't match substrings like 'us' in 'Status'
            const sizeLabelRegex = /\b(uk|us|eur|fr|jp|cm|mm)\b/i; 
            
            if (lowerH.includes('size')) {
                 isCandidate = true;
            } 
            else if (sizeLabelRegex.test(h)) {
                 isCandidate = true;
            }
            // Catch cases like "US8", "UK-9" where there is no space
            else if (/^(uk|us|eur)[_\-\.]?[0-9]+/i.test(h)) {
                 isCandidate = true;
            }

            // Rule B: Is purely numeric or numeric-like (e.g., "3", "3.5", "10", "11.5")
            // This regex allows simple integers and decimals
            else if (/^[\d\.]+$/.test(h)) isCandidate = true;

            // Rule C: Catch weird formats like "UK3-" if they appear as headers
            else if (/^(uk|us)\s*[\d\.\-]+$/i.test(h)) isCandidate = true;

            if (!isCandidate) return false;

            // 3. Data Validation (Value-based)
            // Check the first 15 rows. If this is a size column, values should be numbers or empty.
            let hasNonNumericData = false;
            let hasNumericData = false;

            for (let i = 0; i < Math.min(rows.length, 15); i++) {
                const val = rows[i][header];
                if (val === undefined || val === null || val === '') continue;

                const strVal = String(val).trim();
                // Check if parsable as number
                if (!isNaN(parseFloat(strVal))) {
                    hasNumericData = true;
                } else {
                    // It has a value but it's not a number.
                    hasNonNumericData = true;
                    break;
                }
            }

            // If we found non-numeric strings, it's not a quantity column.
            if (hasNonNumericData) return false;

            return true;
        });

        if (suggestedSizeColumns.length === 0) {
            reject(new Error("No Size Columns Found: Could not detect any columns representing sizes (e.g. '3.5', 'UK 4'). Please check if your headers are correct."));
            return;
        }

        // Extract unique SO Numbers
        const soNumbers = Array.from(new Set(
            rows
            .map(r => r['SO_Number'])
            .filter(Boolean)
            .map(String)
        ));

        // Auto-detect Article, Model and Color columns
        const articleHeader = cleanHeaders.find(h => /Article|Art(\.)?\s*No|型號/i.test(h));
        const modelHeader = cleanHeaders.find(h => /Model|型體名稱/i.test(h));
        const colorHeader = cleanHeaders.find(h => /Color|Colour|顏色|色名/i.test(h));

        resolve({
            headers: cleanHeaders,
            rows,
            sizeColumns: suggestedSizeColumns, 
            infoColumns: [], 
            soNumbers,
            articleHeader,
            modelHeader,
            colorHeader
        });

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(new Error("File Read Error: Could not read the file."));
    reader.readAsArrayBuffer(file);
  });
};