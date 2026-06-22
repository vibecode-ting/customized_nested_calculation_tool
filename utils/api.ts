export async function logAction(action: string, details: any = {}) {
    // Logging is disabled for static deployment
    console.log(`[Log Action Disabled]: ${action}`, details);
}

export async function executeQuery(sql: string): Promise<any> {
    // SQL queries are disabled for static deployment
    console.log(`[SQL Query Disabled]: ${sql}`);
    return { rows: [], rowCount: 0 };
}

export async function fetchLogs() {
    // Mock empty logs for static deployment
    return [];
}

export async function fetchFilteredLogs(startDate: string, endDate: string, actionType?: string) {
    // Mock empty logs for static deployment
    return [];
}
