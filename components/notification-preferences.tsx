'use client';

import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useNotifications, NotificationPreferences } from '@/contexts/NotificationContext';

const NotificationPreferencesComponent: React.FC = () => {
  const { preferences, updatePreferences } = useNotifications();
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(preferences);

  const handleToggle = (key: keyof NotificationPreferences) => {
    const newValue = !localPreferences[key];
    setLocalPreferences(prev => ({ ...prev, [key]: newValue }));
    // Auto-save on toggle
    updatePreferences({ ...localPreferences, [key]: newValue });
  };

  const notificationCategories = [
    {
      title: 'Investment & Portfolio',
      settings: [
        {
          key: 'investment_updates' as keyof NotificationPreferences,
          title: 'Investment Updates',
          description: 'Get updates when your crops/livestock are started, growth stages, or harvested.',
          enabled: localPreferences.investment_updates,
        },
        {
          key: 'market_updates' as keyof NotificationPreferences,
          title: 'ROI & Payout Alerts',
          description: 'Be notified when your returns are ready or payouts are sent.',
          enabled: localPreferences.market_updates,
        },
      ]
    },
    {
      title: 'App & System',
      settings: [
        {
          key: 'email_notifications' as keyof NotificationPreferences,
          title: 'App Announcements',
          description: 'Stay informed about new features and updates.',
          enabled: localPreferences.email_notifications,
        },
        {
          key: 'security_alerts' as keyof NotificationPreferences,
          title: 'Security Alerts',
          description: 'Get notified if there\'s a login from a new device or account changes.',
          enabled: localPreferences.security_alerts,
        },
      ]
    },
    {
      title: 'Promotions & Marketing',
      settings: [
        {
          key: 'push_notifications' as keyof NotificationPreferences,
          title: 'Offers & Promotions',
          description: 'Occasional offers, bonuses, and news from AgriPath.',
          enabled: localPreferences.push_notifications,
        },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Notifications</h1>
      
      <div className="space-y-8">
        {notificationCategories.map((category, categoryIndex) => (
          <div key={category.title}>
            <h2 className="text-lg font-semibold text-green-600 mb-4">{category.title}</h2>
            
            <div className="space-y-4">
              {category.settings.map((setting, settingIndex) => (
                <div key={setting.key}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <Label htmlFor={setting.key} className="text-base font-semibold text-gray-900">
                        {setting.title}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {setting.description}
                      </p>
                    </div>
                    
                    <Switch
                      id={setting.key}
                      checked={setting.enabled}
                      onCheckedChange={() => handleToggle(setting.key)}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                  
                  {settingIndex < category.settings.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
            
            {categoryIndex < notificationCategories.length - 1 && (
              <Separator className="mt-8" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationPreferencesComponent;