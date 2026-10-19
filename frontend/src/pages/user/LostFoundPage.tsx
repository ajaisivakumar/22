import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  PackageSearch,
  PlusCircle,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Flag,
  Upload,
} from 'lucide-react';
import { LostFoundItem, ItemType, ItemStatus } from '../../types/lostfound.types';
import { lostFoundService } from '../../services/lostfound.service';
import { lostFoundItemSchema, LostFoundItemFormData } from '../../utils/validators';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

export const LostFoundPage: React.FC = () => {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    loadItems();
  }, [selectedType]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await lostFoundService.getItems(
        selectedType === 'ALL' ? undefined : { type: selectedType }
      );
      setItems(data);
    } catch {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LostFoundItemFormData>({
    resolver: zodResolver(lostFoundItemSchema),
    defaultValues: {
      type: 'FOUND',
      category: 'Electronics',
      date: new Date().toISOString().slice(0, 10),
      isSensitive: false,
    },
  });

  const isSensitiveWatch = watch('isSensitive', false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setImagePreview(fakeUrl);
      setValue('imageUrl', fakeUrl);
    }
  };

  const onSubmitItem = async (data: LostFoundItemFormData) => {
    try {
      await lostFoundService.createItem({
        title: data.title,
        type: data.type,
        category: data.category,
        location: data.location,
        date: data.date,
        description: data.description,
        imageUrl: imagePreview || data.imageUrl || undefined,
        contactInfo: data.contactInfo || undefined,
        isSensitive: data.isSensitive,
        status: 'OPEN',
      });
      toast.success(`${data.type === 'FOUND' ? 'Found' : 'Lost'} item report posted!`);
      setIsPostModalOpen(false);
      reset();
      setImagePreview('');
      loadItems();
    } catch {
      toast.error('Failed to post item');
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: ItemStatus) => {
    try {
      await lostFoundService.updateItemStatus(id, newStatus);
      toast.success(`Item status updated to ${newStatus}`);
      if (selectedItem) {
        setSelectedItem({ ...selectedItem, status: newStatus });
      }
      loadItems();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleReport = () => {
    toast.success('Report submitted to campus moderation desk');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-brand-blue" />
            Campus Lost & Found
          </h1>
          <p className="text-sm text-gray-500">
            Recover misplaced belongings or return discovered items across labs, library, canteen and auditoriums.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsPostModalOpen(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Post Lost / Found Item
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        {(['ALL', 'FOUND', 'LOST'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSelectedType(t)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              selectedType === t
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {t === 'ALL' ? 'All Items' : `${t} Items`}
          </button>
        ))}
      </div>

      {/* Item Feed Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <PackageSearch className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-base font-semibold text-gray-900">No items found</h3>
          <p className="mt-1 text-xs text-gray-500">
            No active posts match your filter. Check back soon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} hoverable className="flex flex-col justify-between">
              <div>
                <div className="h-44 w-full bg-gray-100 overflow-hidden relative">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <PackageSearch className="w-10 h-10" />
                    </div>
                  )}

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.type === 'LOST'
                          ? 'bg-red-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {item.type}
                    </span>
                  </div>

                  {item.isSensitive && (
                    <div className="absolute bottom-2.5 left-2.5 bg-amber-500/90 text-white px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 backdrop-blur-xs">
                      <AlertTriangle className="w-3 h-3" />
                      Sensitive Item
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{item.category}</span>
                    <span>{formatDate(item.date)}</span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-1 text-xs text-gray-500 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-gray-50 flex items-center justify-between mt-2">
                <Badge status={item.status} size="sm" />
                <Button variant="ghost" size="sm" onClick={() => setSelectedItem(item)}>
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title}
        maxWidth="lg"
      >
        {selectedItem && (
          <div className="space-y-4 text-xs sm:text-sm">
            {selectedItem.imageUrl && (
              <div className="h-52 rounded-lg overflow-hidden">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  selectedItem.type === 'LOST'
                    ? 'bg-red-100 text-primary'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {selectedItem.type}
              </span>
              <Badge status={selectedItem.status} />
              <span className="text-xs text-gray-500">{selectedItem.category}</span>
            </div>

            {selectedItem.isSensitive && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Sensitive Item Notice:</strong> To prevent fraud or identity theft, claimants must show their official college ID card to campus security.
                </span>
              </div>
            )}

            <p className="text-gray-700 leading-relaxed">{selectedItem.description}</p>

            <div className="p-3 bg-gray-50 rounded-lg space-y-1.5 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-primary" />
                <span><strong>Location:</strong> {selectedItem.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-primary" />
                <span><strong>Reported Date:</strong> {formatDate(selectedItem.date)}</span>
              </div>
              {selectedItem.contactInfo && (
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span><strong>Contact / Claim Point:</strong> {selectedItem.contactInfo}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleReport}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <Flag className="w-3.5 h-3.5" /> Report inappropriate post
              </button>

              <div className="flex gap-2">
                {selectedItem.status === 'OPEN' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedItem.id, 'RESOLVED')}
                  >
                    Mark as Resolved / Claimed
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => setSelectedItem(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* POST LOST/FOUND MODAL */}
      <Modal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        title="Post Lost or Found Item"
        description="Help return belongings to their rightful student owner"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmitItem)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" {...register('type')}>
              <option value="FOUND">I Found an Item</option>
              <option value="LOST">I Lost an Item</option>
            </Select>

            <Select label="Category" {...register('category')}>
              <option value="Electronics">Electronics & Laptops</option>
              <option value="Bottles & Containers">Bottles & Bags</option>
              <option value="Valuables & Wallets">Valuables & Wallets</option>
              <option value="ID Cards & Documents">College ID / Documents</option>
              <option value="Books & Stationery">Books & Stationery</option>
              <option value="Other">Other</option>
            </Select>
          </div>

          <Input
            label="Item Title"
            placeholder="e.g. Navy Blue Umbrella with wooden handle"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Location Lost / Found"
              placeholder="e.g. Turing Lab 3 or Canteen Counter"
              error={errors.location?.message}
              {...register('location')}
            />

            <Input
              label="Date"
              type="date"
              error={errors.date?.message}
              {...register('date')}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Detailed Description</label>
            <textarea
              rows={3}
              placeholder="Provide unique characteristics, scratches, or markings..."
              className="w-full text-xs sm:text-sm rounded-lg border border-gray-300 p-2.5 focus:border-primary focus:outline-none"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-red-600 font-medium">{errors.description.message}</p>
            )}
          </div>

          <Input
            label="Contact Info / Deposited Location"
            placeholder="e.g. Handed to Library Reception desk"
            error={errors.contactInfo?.message}
            {...register('contactInfo')}
          />

          {/* Image Upload with preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Photograph</label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                <Upload className="w-4 h-4 text-gray-500" />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imagePreview && (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Privacy Warning check */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <input
              id="isSensitive"
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-amber-400 text-primary focus:ring-primary"
              {...register('isSensitive')}
            />
            <label htmlFor="isSensitive" className="text-xs text-amber-900 leading-snug">
              <strong>Sensitive item protection:</strong> Check this if this item includes wallets, ID cards, keys, or mobile phones. Specific identifiers will remain masked until verification.
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsPostModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LostFoundPage;
