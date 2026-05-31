'use client';

import { useState, useEffect, useCallback } from 'react';

interface MenuItem {
  id: string;
  content: string;
  metadata: {
    source?: string;
    chunk_index?: number;
    total_chunks?: number;
  };
  created_at: string;
}

interface MenuItemsTableProps {
  refreshTrigger: number;
  password: string;
}

export default function MenuItemsTable({ refreshTrigger, password }: MenuItemsTableProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/menu-items');
      const data = await response.json();
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems, refreshTrigger]);

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL indexed menu data? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/menu-items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setItems([]);
      }
    } catch (error) {
      console.error('Error deleting items:', error);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-100 p-4 sm:p-6 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          <span>Indexed Menu Data ({items.length} chunks)</span>
        </h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={fetchItems}
            className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors font-medium text-center"
          >
            ↻ Refresh
          </button>
          {items.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={deleting}
              className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium disabled:opacity-50 text-center"
            >
              {deleting ? 'Deleting...' : '🗑️ Delete All'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 font-medium">
            No menu data indexed yet.
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Upload a PDF to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs sm:text-sm min-w-[500px] sm:min-w-full table-fixed">
            <thead>
              <tr className="border-b-2 border-amber-200">
                <th className="text-left py-3 px-2 text-gray-600 font-semibold w-8 sm:w-12">#</th>
                <th className="text-left py-3 px-2 text-gray-600 font-semibold">Content Preview</th>
                <th className="text-left py-3 px-2 text-gray-600 font-semibold w-20 sm:w-32">Source File</th>
                <th className="text-left py-3 px-2 text-gray-600 font-semibold w-24 sm:w-40">Indexed At</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-amber-50/50 transition-colors"
                >
                  <td className="py-2.5 px-2 text-gray-400 font-mono">
                    {index + 1}
                  </td>
                  <td className="py-2.5 px-2 text-gray-700 break-words">
                    <span className="line-clamp-2 sm:line-clamp-3">
                      {item.content.substring(0, 150)}
                      {item.content.length > 150 ? '...' : ''}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-gray-500">
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis block max-w-[80px] sm:max-w-full">
                      {item.metadata?.source || 'Unknown'}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-gray-400 text-[10px] sm:text-xs whitespace-nowrap">
                    {formatDate(item.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
