/**
 * Utility functions for exporting data to CSV format
 */

export interface ExportableTransaction {
  transactionId: string;
  method: string;
  project: string;
  amount: string;
  unit: string;
  status: string;
  date: string;
  description?: string;
}

/**
 * Converts an array of transactions to CSV format
 */
export const convertTransactionsToCSV = (transactions: ExportableTransaction[]): string => {
  if (transactions.length === 0) {
    return '';
  }

  // CSV headers
  const headers = [
    'Transaction ID',
    'Method',
    'Project',
    'Amount',
    'Unit',
    'Status',
    'Date',
    'Description'
  ];

  // Convert transactions to CSV rows
  const rows = transactions.map(transaction => [
    transaction.transactionId,
    transaction.method,
    transaction.project,
    transaction.amount,
    transaction.unit,
    transaction.status,
    transaction.date,
    transaction.description || ''
  ]);

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => 
      row.map(field => {
        // Escape fields that contain commas, quotes, or newlines
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',')
    )
    .join('\n');

  return csvContent;
};

/**
 * Downloads CSV content as a file
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  // Create blob with CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
};

/**
 * Generates a filename with timestamp
 */
export const generateTransactionFilename = (): string => {
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  return `agripath-transactions-${timestamp}.csv`;
};
