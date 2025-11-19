'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/app/utils/supabase/client';
import { Check, X, Eye } from 'lucide-react';

interface PendingKyc {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  kyc_status: string;
  kyc_documents: {
    id_front?: string;
    id_back?: string;
    selfie?: string;
  } | null;
  created_at: string;
}

const AdminPage: React.FC = () => {
  const [pendingKycs, setPendingKycs] = useState<PendingKyc[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchPendingKycs();
  }, []);

  const fetchPendingKycs = async () => {
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('*')
        .eq('kyc_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        return;
      }

      if (data) {
        setPendingKycs(data as PendingKyc[]);
      }
    } catch (error) {
      // Error fetching pending KYC
    } finally {
      setLoading(false);
    }
  };

  const updateKycStatus = async (profileId: string, status: 'Completed' | 'Failed') => {
    setProcessing(profileId);
    
    try {
      // Update profile table
      const { error: profileError } = await supabase
        .from('profile')
        .update({ kyc_status: status === 'Completed' ? 'verified' : 'rejected' })
        .eq('id', profileId);

      if (profileError) {
        return;
      }

      // Refresh the list
      await fetchPendingKycs();
    } catch (error) {
      // Error updating KYC status
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard - KYC Approvals</h1>
        
        {pendingKycs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No pending KYC verifications</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {pendingKycs.map((kyc) => (
              <Card key={kyc.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {kyc.first_name} {kyc.last_name}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{kyc.email}</p>
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(kyc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">Pending Review</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {kyc.kyc_documents?.id_front && (
                        <div className="text-center">
                          <p className="text-sm font-medium mb-2">ID Front</p>
                          <img 
                            src={kyc.kyc_documents.id_front} 
                            alt="ID Front" 
                            className="w-full h-32 object-cover rounded border"
                          />
                        </div>
                      )}
                      {kyc.kyc_documents?.id_back && (
                        <div className="text-center">
                          <p className="text-sm font-medium mb-2">ID Back</p>
                          <img 
                            src={kyc.kyc_documents.id_back} 
                            alt="ID Back" 
                            className="w-full h-32 object-cover rounded border"
                          />
                        </div>
                      )}
                      {kyc.kyc_documents?.selfie && (
                        <div className="text-center">
                          <p className="text-sm font-medium mb-2">Selfie</p>
                          <img 
                            src={kyc.kyc_documents.selfie} 
                            alt="Selfie" 
                            className="w-full h-32 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => updateKycStatus(kyc.id, 'Completed')}
                        disabled={processing === kyc.id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {processing === kyc.id ? 'Processing...' : 'Approve'}
                      </Button>
                      <Button
                        onClick={() => updateKycStatus(kyc.id, 'Failed')}
                        disabled={processing === kyc.id}
                        variant="destructive"
                      >
                        <X className="w-4 h-4 mr-2" />
                        {processing === kyc.id ? 'Processing...' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;

