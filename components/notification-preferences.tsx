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

  // Map to database categories: Investment, System, Marketing, Announcement, Alert
  const notificationCategories = [
    {
      title: 'Investment & Portfolio',
      settings: [
        {
          key: 'investment_updates' as keyof NotificationPreferences,
          title: 'Project Updates',
          description: 'Stay in the loop about your farm projects—from planting to harvest and everything in between.',
          enabled: localPreferences.investment_updates,
          // Maps to: category = 'Investment'
        },
        {
          key: 'market_updates' as keyof NotificationPreferences,
          title: 'Returns & Payouts',
          description: 'Know the moment your earnings are ready or when payouts hit your account.',
          enabled: localPreferences.market_updates,
          // Maps to: category = 'Investment' (high priority)
        },
      ]
    },
    {
      title: 'App & System',
      settings: [
        {
          key: 'email_notifications' as keyof NotificationPreferences,
          title: 'Platform News',
          description: 'Discover new features, improvements, and important announcements from AgriPath.',
          enabled: localPreferences.email_notifications,
          // Maps to: category = 'Announcement'
        },
        {
          key: 'security_alerts' as keyof NotificationPreferences,
          title: 'Account Security',
          description: 'Get alerted about logins from new devices or important account changes.',
          enabled: localPreferences.security_alerts,
          // Maps to: category = 'Alert'
        },
      ]
    },
    {
      title: 'Promotions & Marketing',
      settings: [
        {
          key: 'push_notifications' as keyof NotificationPreferences,
          title: 'Exclusive Deals',
          description: 'Receive special offers, bonuses, and opportunities tailored just for you.',
          enabled: localPreferences.push_notifications,
          // Maps to: category = 'Marketing'
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