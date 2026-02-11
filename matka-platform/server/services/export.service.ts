// server/services/export.service.ts
// CSV export utility — Generates CSV strings from data arrays

interface ColumnDefinition {
    header: string;
    key: string;
}

export class ExportService {

    /**
     * Generate a CSV string from an array of objects
     * Handles commas in data (wraps in quotes)
     * Uses plain numbers for currency (no symbols)
     */
    static generateCsv(data: Record<string, unknown>[], columns: ColumnDefinition[]): string {
        const lines: string[] = [];

        // Header row
        lines.push(columns.map(c => ExportService.escapeField(c.header)).join(','));

        // Data rows
        for (const row of data) {
            const values = columns.map(col => {
                const value = row[col.key];
                if (value === null || value === undefined) return '';
                return ExportService.escapeField(String(value));
            });
            lines.push(values.join(','));
        }

        return lines.join('\r\n');
    }

    /**
     * Escape a CSV field — wrap in double quotes if it contains comma, newline, or quotes
     */
    private static escapeField(value: string): string {
        if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }
}
