import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2, Check, Plus, FolderOpen } from 'lucide-react';
import { AppCalculatorsState, SavedPreset } from '../types';

interface SavedPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCalc: keyof AppCalculatorsState;
  currentState: AppCalculatorsState;
  onLoadPreset: (calcType: keyof AppCalculatorsState, state: any) => void;
}

const STORAGE_KEY = 'calculator_hub_saved_presets_v1';

export const SavedPresetsModal: React.FC<SavedPresetsModalProps> = ({
  isOpen,
  onClose,
  currentCalc,
  currentState,
  onLoadPreset,
}) => {
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPresets(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load saved presets from localStorage', err);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCurrent = () => {
    if (!presetName.trim()) return;

    const newPreset: SavedPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      calcType: currentCalc,
      state: currentState[currentCalc],
    };

    const updated = [newPreset, ...presets];
    setPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setPresetName('');
  };

  const handleDelete = (id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleApply = (preset: SavedPreset) => {
    onLoadPreset(preset.calcType, preset.state);
    setCopiedId(preset.id);
    setTimeout(() => setCopiedId(null), 1500);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-card rounded-2xl p-6 border border-gray-800 shadow-2xl flex flex-col gap-5">
        <div className="flex justify-between items-center border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-lg text-white">Saved Scenario Presets</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg bg-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Create New Preset Section */}
        <div className="flex flex-col gap-2 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
          <label className="text-xs font-semibold text-gray-300">
            Save Current ({currentCalc.toUpperCase()}) Scenario
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="e.g. Aggressive Retirement 2026..."
              className="flex-1 bg-gray-900 border border-gray-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={handleSaveCurrent}
              disabled={!presetName.trim()}
              className="flex items-center space-x-1 px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Presets List */}
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
          {presets.length > 0 ? (
            presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between p-3 bg-card-alt rounded-xl border border-gray-800 hover:border-gray-700 transition"
              >
                <div>
                  <div className="font-semibold text-xs text-white flex items-center gap-2">
                    <span>{preset.name}</span>
                    <span className="text-[9px] uppercase font-bold bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20">
                      {preset.calcType}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">Saved on {preset.date}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleApply(preset)}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-lg border border-orange-500/20 transition cursor-pointer"
                  >
                    {copiedId === preset.id ? (
                      <Check className="w-3.5 h-3.5 text-orange-400" />
                    ) : (
                      <FolderOpen className="w-3.5 h-3.5" />
                    )}
                    <span>Load</span>
                  </button>
                  <button
                    onClick={() => handleDelete(preset.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition"
                    title="Delete Preset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 text-xs">
              No saved scenario presets found. Enter a name above to save your current setup!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
