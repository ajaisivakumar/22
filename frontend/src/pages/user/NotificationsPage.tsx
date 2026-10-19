import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Flame,
  Calendar,
  Users2,
  PackageSearch,
  MessageSquareWarning,
  Info,
  Check,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationType, NotificationItem } from '../../types/notification.types';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatRelativeTime } from '../../utils/format';

export const NotificationsPage: React.FC = () => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const navigate = useNavigate();

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'POLL':
        return <Flame className="w-5 h-5 text-primary" />;
      case 'EVENT':
        return <Calendar className="w-5 h-5 text-brand-blue" />;
      case 'PARTNER':
        return <Users2 className="w-5 h-5 text-brand-green" />;
      case 'LOSTFOUND':
        return <PackageSearch className="w-5 h-5 text-amber-500" />;
      case 'COMPLAINT':
        return <MessageSquareWarning className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const displayedNotifications =
    filter === 'UNREAD' ? notifications.filter((n) => !n.read) : notifications;

  const handleClickItem = (item: NotificationItem) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Notifications & Activity Alerts
          </h1>
          <p className="text-sm text-gray-500">
            Updates on active polls, squad messages, event announcements, and lab tickets.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => markAllAsRead()}
          leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        >
          Mark All as Read
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'ALL'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('UNREAD')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'UNREAD'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Unread ({notifications.filter((n) => !n.read).length})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : displayedNotifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Bell className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-base font-semibold text-gray-900">
            {filter === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="mt-1 text-xs text-gray-500">You are completely caught up with college activity.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedNotifications.map((item) => (
            <Card
              key={item.id}
              hoverable
              className={`cursor-pointer transition-colors ${
                !item.read ? 'bg-red-50/20 border-red-200' : 'bg-white'
              }`}
              onClick={() => handleClickItem(item)}
            >
              <CardBody className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  {getIconForType(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{item.title}</h3>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{item.message}</p>
                </div>

                {!item.read && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(item.id);
                    }}
                    className="p-1 text-gray-400 hover:text-primary rounded"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
