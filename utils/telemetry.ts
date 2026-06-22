/**
 * Telemetry Service for PMA Nesting v2.4
 * Stores logs locally in browser storage and provides CSV export.
 */

const LOG_STORAGE_KEY = 'pma_usage_audit_v24';

export interface TelemetryLog {
  timestamp: string;
  ip: string;
  event: 'APP_OPEN' | 'GENERATE_NESTING' | 'EXPORT_EXCEL';
  so_list: string;
  total_pairs: number;
  order_count: number;
  user_agent: string;
}

/**
 * Fetches the public IP address of the client.
 */
const getClientIp = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'unknown';
  }
};

/**
 * Main Logging function
 */
import { logAction } from './api';

/**
 * Main Logging function
 */
export const logUsage = async (event: TelemetryLog['event'], details: Record<string, any> = {}) => {
  try {
    // Format details for backend (and local storage)
    const backendDetails = {
      so_list: details.selectedOrders ? details.selectedOrders.join(';') : (details.datasetName || ''),
      total_pairs: details.totalQty || 0,
      order_count: details.orderCount || 0,
      ...details
    };

    // Save to LocalStorage for local auditing
    const existingLogsRaw = localStorage.getItem(LOG_STORAGE_KEY);
    const logs: TelemetryLog[] = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
    
    logs.push({
      timestamp: new Date().toISOString(),
      ip: await getClientIp(),
      event,
      so_list: backendDetails.so_list,
      total_pairs: backendDetails.total_pairs,
      order_count: backendDetails.order_count,
      user_agent: navigator.userAgent
    });
    
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));

    // Call mocked backend logic (does nothing now)
    await logAction(event, backendDetails);
  } catch (err) {
    console.warn("Logging error:", err);
  }
};

/**
 * Helper to export browser-stored logs as CSV
 */
export const downloadAuditCSV = () => {
  const existingLogsRaw = localStorage.getItem(LOG_STORAGE_KEY);
  if (!existingLogsRaw) {
    alert("No logs found in this browser.");
    return;
  }

  const logs: TelemetryLog[] = JSON.parse(existingLogsRaw);

  // CSV Header
  const headers = ["Timestamp", "IP", "Event", "SO_List", "Total_Pairs", "Order_Count", "User_Agent"];

  // Rows
  const rows = logs.map(l => [
    l.timestamp,
    l.ip,
    l.event,
    `"${l.so_list}"`, // Quote for potential semicolons
    l.total_pairs,
    l.order_count,
    `"${l.user_agent}"`
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `PMA_Usage_Audit_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};