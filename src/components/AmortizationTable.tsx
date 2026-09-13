import React, { useState } from 'react';
import { Download, Table as TableIcon, Search, FileText } from 'lucide-react';
import { generatePdfReport } from '../utils/pdfExport';

interface AmortizationTableProps {
  title?: string;
  headers: string[];
  rows: (string | number)[][];
  filename?: string;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  title = 'Schedule Breakdown',
  headers,
  rows,
  filename = 'wealth_schedule',
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!headers || headers.length === 0 || !rows || rows.length === 0) {
    return null;
  }

  // Filter rows based on search
  const filteredRows = rows.filter((row) =>
    row.some((cell) => String(cell).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExportPDF = () => {
    generatePdfReport({
      title: title,
      subtitle: `Schedule Breakdown Report (${filteredRows.length} periods)`,
      metrics: [
        { label: 'Total Schedule Periods', value: String(filteredRows.length) },
        { label: 'Export Date', value: new Date().toLocaleDateString() },
      ],
      tableHeaders: headers,
      tableRows: filteredRows.map((r) => r.map((c) => String(c))),
    });
  };

  return (
    <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-4 md:p-5 space-y-4 shadow-xl">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <TableIcon className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
          <span className="text-xs bg-gray-900 border border-gray-800 px-2 py-0.5 rounded-full text-gray-400 font-mono">
            {filteredRows.length} Rows
          </span>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search timeline..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#18181b] border border-gray-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 shadow-sm"
            title="Export schedule data as PDF report"
            aria-label="Export schedule data as PDF report"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Table Container with full horizontal scrollable wrapper */}
      <div className="overflow-x-auto rounded-xl border border-gray-800/80 max-h-96 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-xs min-w-[500px]">
          <thead className="bg-[#18181b] sticky top-0 z-10 text-gray-300 uppercase tracking-wider font-semibold border-b border-gray-800">
            <tr>
              {headers.map((h, idx) => (
                <th key={idx} className="px-4 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-mono">
            {filteredRows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="hover:bg-gray-800/50 transition-colors odd:bg-gray-900/40"
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-4 py-2.5 whitespace-nowrap ${
                      cIdx === 0
                        ? 'font-bold text-gray-200'
                        : cIdx === row.length - 1
                        ? 'font-bold text-emerald-400'
                        : 'text-gray-300'
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
