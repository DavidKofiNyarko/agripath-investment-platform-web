'use client';

import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/contexts/NotificationContext';

const NotificationPreferencesComponent: React.FC = () => {
  const { preferences, updatePreferences } = useNotifications();
  const [enabled, setEnabled] = useState(
    preferences.investment_updates || 
    preferences.market_updates || 
    preferences.email_notifications || 
    preferences.security_alerts || 
    preferences.push_notifications
  );

  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    // Update all notification preferences to the same value
    updatePreferences({
      investment_updates: newValue,
      market_updates: newValue,
      email_notifications: newValue,
      security_alerts: newValue,
      push_notifications: newValue,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Notification Preferences</h1>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label htmlFor="notifications-toggle" className="text-lg font-semibold text-gray-900">
              Receive Notifications
            </Label>
            <p className="text-sm text-gray-600 mt-2">
              Enable or disable all notifications from AgriPath. When enabled, you'll receive updates about your investments, account security, platform news, and exclusive offers.
            </p>
          </div>
          
          <Switch
            id="notifications-toggle"
            checked={enabled}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-green-600 ml-4"
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferencesComponent;