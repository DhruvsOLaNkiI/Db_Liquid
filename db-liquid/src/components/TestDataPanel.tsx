import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useListings } from '../context/ListingsContext';
import {
  downloadTestDataExcel,
  importTestDataFromExcel,
  loadBundledSampleExcel,
} from '../utils/testDataExcel';

export function TestDataPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { reloadListings } = useListings();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleImport(file: File) {
    setLoading(true);
    setMessage(null);
    try {
      const result = await importTestDataFromExcel(file);
      reloadListings();
      setMessage(`Loaded ${result.users} users, ${result.listings} listings, ${result.bids} bids. Refresh the page to see everything.`);
      window.location.reload();
    } catch {
      setMessage('Could not read that file. Use the Excel workbook with Users, Listings, and Bids sheets.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadSample() {
    setLoading(true);
    setMessage(null);
    try {
      const result = await loadBundledSampleExcel();
      reloadListings();
      setMessage(`Sample data loaded: ${result.users} users, ${result.listings} listings, ${result.bids} bids.`);
      window.location.reload();
    } catch {
      setMessage('Sample Excel file missing. Run: npm run build:test-data');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-16 text-left bg-gray-50 rounded-3xl border border-gray-100 p-8">
      <div className="flex items-start gap-3 mb-4">
        <FileSpreadsheet className="text-primary shrink-0 mt-1" size={24} />
        <div>
          <h2 className="text-xl font-bold">Test data (Excel)</h2>
          <p className="text-gray-600 text-sm mt-1">
            Edit the local Excel file for testing — no database needed. File location:{' '}
            <code className="bg-white px-1.5 py-0.5 rounded text-xs">data/testing/db-liquid-test-data.xlsx</code>
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={handleLoadSample}
          className="px-5 py-3 bg-primary text-white rounded-2xl font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          Load sample Excel
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => downloadTestDataExcel()}
          className="px-5 py-3 bg-white border border-gray-200 rounded-2xl font-medium text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Download size={16} />
          Export to Excel
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
          className="px-5 py-3 bg-white border border-gray-200 rounded-2xl font-medium text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Upload size={16} />
          Import Excel
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImport(file);
            e.target.value = '';
          }}
        />
      </div>

      <div className="mt-6 text-sm text-gray-600 space-y-1">
        <p><strong>Users sheet:</strong> buyer/seller login (id, email, phone, name, password, roles)</p>
        <p><strong>Listings sheet:</strong> properties (sellerId links to Users.id)</p>
        <p><strong>Bids sheet:</strong> bids (listingId links to Listings.id)</p>
        <p className="pt-2 text-gray-500">
          Sample logins after load: seller@example.com / seller123 · buyer@example.com / buyer123
        </p>
      </div>

      {message && (
        <p className="mt-4 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3">
          {message}
        </p>
      )}
    </section>
  );
}
