import React, { useState, useEffect } from 'react';
import { PackageSearch, EyeOff, Eye, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { LostFoundItem, ItemStatus } from '../../types/lostfound.types';
import { lostFoundService } from '../../services/lostfound.service';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

export const AdminLostFoundPage: React.FC = () => {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await lostFoundService.adminGetAllItems();
      setItems(data);
    } catch {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHide = async (item: LostFoundItem) => {
    const newStatus: ItemStatus = item.status === 'HIDDEN' ? 'OPEN' : 'HIDDEN';
    try {
      await lostFoundService.updateItemStatus(item.id, newStatus);
      toast.success(newStatus === 'HIDDEN' ? 'Item post hidden from students' : 'Item restored to public feed');
      loadItems();
    } catch {
      toast.error('Status update failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await lostFoundService.deleteItem(id);
      toast.success('Item post deleted');
      loadItems();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <PackageSearch className="w-6 h-6 text-brand-blue" />
          Lost & Found Moderation
        </h1>
        <p className="text-sm text-gray-500">
          Supervise reported student belongings, verify sensitive valuables, and remove spam or abusive reports.
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Item Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Sensitive</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">No items found</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900 max-w-xs truncate">{item.title}</td>
                    <td className="py-3 px-4 font-semibold">
                      <span className={item.type === 'LOST' ? 'text-red-600' : 'text-emerald-600'}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{item.category}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs truncate max-w-[150px]">{item.location}</td>
                    <td className="py-3 px-4">
                      {item.isSensitive ? (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Sensitive
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Standard</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={item.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleToggleHide(item)}
                          title={item.status === 'HIDDEN' ? 'Restore Item' : 'Hide from Public'}
                        >
                          {item.status === 'HIDDEN' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(item.id)}
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminLostFoundPage;
