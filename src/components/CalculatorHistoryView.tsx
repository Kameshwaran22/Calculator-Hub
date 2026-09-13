import React, { useState } from 'react';
import {
  ArrowLeft,
  Trash2,
  X,
  ListChecks,
  RotateCcw,
  Copy,
  Check,
  FileText,
  Download,
} from 'lucide-react';
import { CalcHistoryEntry } from '../types';
import { generatePdfReport } from '../utils/pdfExport';
import { triggerTapHaptic } from '../utils/haptics';

interface CalculatorHistoryViewProps {
  history: CalcHistoryEntry[];
  onBack: () => void;
  onSelectEntry: (entry: CalcHistoryEntry) => void;
  onDeleteEntries: (ids: string[]) => void;
  onClearAll: () => void;
}

export const CalculatorHistoryView: React.FC<CalculatorHistoryViewProps> = ({
  history,
  onBack,
  onSelectEntry,
  onDeleteEntries,
  onClearAll,
}) => {
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Group history items by date (extracted from timestamp or fallback to today)
  const groupedHistory = React.useMemo(() => {
    const groups: { date: string; items: CalcHistoryEntry[] }[] = [];
    const map = new Map<string, CalcHistoryEntry[]>();

    history.forEach((item) => {
      const dateLabel = item.timestamp?.includes('/') || item.timestamp?.includes('-')
        ? item.timestamp.split(' ')[0]
        : 'Today';

      if (!map.has(dateLabel)) {
        map.set(dateLabel, []);
      }
      map.get(dateLabel)!.push(item);
    });

    map.forEach((items, date) => {
      groups.push({ date, items });
    });

    return groups;
  }, [history]);

  const toggleSelectItem = (id: string) => {
    triggerTapHaptic(8);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllToggle = () => {
    triggerTapHaptic(12);
    if (selectedIds.size === history.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(history.map((h) => h.id)));
    }
  };

  const handleConfirmDelete = () => {
    triggerTapHaptic(15);
    if (selectedIds.size > 0) {
      onDeleteEntries(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectMode(false);
    } else {
      onClearAll();
    }
    setShowDeleteConfirmModal(false);
  };

  const handleCopySelected = () => {
    triggerTapHaptic(10);
    const selectedItems = history.filter((h) => selectedIds.has(h.id));
    if (selectedItems.length === 0) return;

    const copyText = selectedItems
      .map((item) => `${item.expression} = ${item.result}`)
      .join('\n');

    navigator.clipboard.writeText(copyText);
    setCopiedNotification(`Copied ${selectedItems.length} calculation(s)`);
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  const handleRecalculateFirstSelected = () => {
    triggerTapHaptic(10);
    const firstSelected = history.find((h) => selectedIds.has(h.id));
    if (firstSelected) {
      onSelectEntry(firstSelected);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black dark:bg-[#000000] text-white flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-10 bg-black/95 dark:bg-[#000000]/95 backdrop-blur-md border-b border-gray-900 px-4 py-3 flex items-center justify-between">
        {isSelectMode ? (
          <>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  triggerTapHaptic(8);
                  setIsSelectMode(false);
                  setSelectedIds(new Set());
                }}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg active:scale-95 transition-transform"
                title="Cancel selection"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-base font-semibold text-white">
                Selected {selectedIds.size} items
              </span>
            </div>

            <button
              onClick={handleSelectAllToggle}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg active:scale-95 transition-transform"
              title="Select all / Deselect all"
            >
              <ListChecks className="w-5 h-5" />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  triggerTapHaptic(8);
                  onBack();
                }}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg active:scale-95 transition-transform"
                title="Back to Calculator"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-lg font-bold tracking-tight text-white">History</span>
            </div>

            <div className="flex items-center space-x-2">
              {history.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      triggerTapHaptic(8);
                      generatePdfReport({
                        title: 'Calculator Calculation History Log',
                        subtitle: `Exported ${history.length} operations from Calculator Hub`,
                        metrics: [
                          { label: 'Total Calculations', value: String(history.length) },
                          { label: 'Export Date', value: new Date().toLocaleDateString() },
                          { label: 'Platform', value: 'Calculator Hub' },
                        ],
                        tableHeaders: ['ID', 'Time/Date', 'Expression', 'Result'],
                        tableRows: history.map((item, idx) => [
                          item.id || String(idx + 1),
                          item.timestamp,
                          item.expression,
                          item.result,
                        ]),
                      });
                    }}
                    className="p-1.5 text-gray-400 hover:text-orange-400 rounded-lg active:scale-95 transition-transform"
                    title="Export PDF Report"
                  >
                    <Download className="w-4.5 h-4.5" />
                  </button>

                  <button
                    onClick={() => {
                      triggerTapHaptic(8);
                      setIsSelectMode(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg active:scale-95 transition-transform"
                    title="Delete calculations"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Copy Notification Toast */}
      {copiedNotification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Scrollable History List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-900/80 border border-gray-800 flex items-center justify-center text-gray-600">
              <FileText className="w-8 h-8 stroke-[1.5]" />
            </div>
            <p className="text-gray-500 font-medium text-sm">No items here yet</p>
          </div>
        ) : (
          groupedHistory.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              {group.date && group.date !== 'Today' && (
                <div className="text-right text-xs font-mono text-gray-500 pt-2 pb-1 border-b border-gray-900/80">
                  {group.date}
                </div>
              )}

              <div className="space-y-2.5">
                {group.items.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (isSelectMode) {
                          toggleSelectItem(item.id);
                        } else {
                          onSelectEntry(item);
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl transition-colors cursor-pointer select-none ${
                        isSelected
                          ? 'bg-orange-950/30 border border-orange-500/40'
                          : 'bg-transparent hover:bg-gray-900/40'
                      }`}
                    >
                      <div className="space-y-0.5 text-right flex-1 pr-3">
                        <div className="text-sm sm:text-base text-gray-300 font-mono tracking-tight">
                          {item.expression} = {item.result}
                        </div>
                      </div>

                      {isSelectMode && (
                        <div className="flex-shrink-0 pl-2">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-orange-500 text-white'
                                : 'border-2 border-gray-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Multi-Select Action Footer (Matching Video) */}
      {isSelectMode && selectedIds.size > 0 && (
        <div className="sticky bottom-0 z-20 bg-gray-950/95 dark:bg-[#0d0d10]/95 backdrop-blur-md border-t border-gray-800/80 py-3 px-6 flex justify-around items-center">
          <button
            onClick={handleRecalculateFirstSelected}
            className="flex flex-col items-center space-y-1 text-gray-400 hover:text-white active:scale-95 transition-transform"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[11px] font-medium">Recalculate</span>
          </button>

          <button
            onClick={handleCopySelected}
            className="flex flex-col items-center space-y-1 text-gray-400 hover:text-white active:scale-95 transition-transform"
          >
            <Copy className="w-5 h-5" />
            <span className="text-[11px] font-medium">Copy</span>
          </button>

          <button
            onClick={() => {
              triggerTapHaptic(10);
              setShowDeleteConfirmModal(true);
            }}
            className="flex flex-col items-center space-y-1 text-red-400 hover:text-red-300 active:scale-95 transition-transform"
          >
            <Trash2 className="w-5 h-5" />
            <span className="text-[11px] font-medium">Delete</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal (Matching Video) */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-gray-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white">Deleting items</h3>
            <p className="text-sm text-gray-300">
              Delete {selectedIds.size > 0 ? `${selectedIds.size} items` : 'all items'} now?
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  triggerTapHaptic(8);
                  setShowDeleteConfirmModal(false);
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/25 active:scale-95 transition-transform"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
