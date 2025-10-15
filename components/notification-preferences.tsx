'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare, Smartphone, TrendingUp, Shield, Bell } from 'lucide-react';
import { useNotifications, NotificationPreferences } from '@/contexts/NotificationContext';

const NotificationPreferencesComponent: React.FC = () => {
  const { preferences, updatePreferences } = useNotifications();
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(preferences);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof NotificationPreferences) => {
    const newValue = !localPreferences[key];
    setLocalPreferences(prev => ({ ...prev, [key]: newValue }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePreferences(localPreferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const notificationSettings = [
    {
      key: 'email_notifications' as keyof NotificationPreferences,
      title: 'Email Notifications',
      description: 'Get notified about important updates via email',
      icon: Mail,
      enabled: localPreferences.email_notifications,
    },
    {
      key: 'sms_notifications' as keyof NotificationPreferences,
      title: 'SMS Notifications',
      description: 'Receive SMS alerts for critical account activities',
      icon: MessageSquare,
      enabled: localPreferences.sms_notifications,
    },
    {
      key: 'push_notifications' as keyof NotificationPreferences,
      title: 'Push Notifications',
      description: 'Get real-time notifications on your device',
      icon: Smartphone,
      enabled: localPreferences.push_notifications,
    },
    {
      key: 'investment_updates' as keyof NotificationPreferences,
      title: 'Investment Updates',
      description: 'Notifications about your investment portfolio',
      icon: TrendingUp,
      enabled: localPreferences.investment_updates,
    },
    {
      key: 'market_updates' as keyof NotificationPreferences,
      title: 'Market Updates',
      description: 'Stay informed about market trends and opportunities',
      icon: Bell,
      enabled: localPreferences.market_updates,
    },
    {
      key: 'security_alerts' as keyof NotificationPreferences,
      title: 'Security Alerts',
      description: 'Immediate alerts for security-related activities',
      icon: Shield,
      enabled: localPreferences.security_alerts,
    },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-green-600" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to be notified about important updates and activities.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {notificationSettings.map((setting) => {
          const IconComponent = setting.icon;
          return (
            <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <IconComponent className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <Label htmlFor={setting.key} className="text-sm font-medium text-gray-900">
                    {setting.title}
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    {setting.description}
                  </p>
                </div>
              </div>
              
              <Switch
                id={setting.key}
                checked={setting.enabled}
                onCheckedChange={() => handleToggle(setting.key)}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          );
        })}
        
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferencesComponent;
