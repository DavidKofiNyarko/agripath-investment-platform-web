'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  Bell, 
  ChevronRight, 
  X, 
  Play,
  Calendar,
  FolderOpen,
  Search
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import { useUpdates } from '@/contexts/UpdatesContext';

interface Update {
  id: number;
  title: string;
  description: string;
  date: string;
  category: string;
  image: string;
  content: string;
  media: MediaItem[];
  isRead: boolean;
}

interface MediaItem {
  id: number;
  image: string;
  title: string;
}

const UpdatesPage = () => {
  const { 
    updates, 
    loading, 
    error, 
    filters, 
    setFilters, 
    refreshUpdates
  } = useUpdates();
  
  const [activeTab, setActiveTab] = useState('new');
  const [selectedUpdate, setSelectedUpdate] = useState<Update | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle search with optimization
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // Only trigger search if value is empty, has 4+ characters, or user hits enter
    if (value.length === 0 || value.length >= 4) {
      setFilters({ ...filters, search: value });
    }
  };

  // Handle search button click or enter key
  const handleSearchSubmit = () => {
    setFilters({ ...filters, search: searchQuery });
  };

  // Handle enter key in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setFilters({ ...filters, search: '' });
  };


  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading updates...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Updates</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refreshUpdates} className="bg-green-600 hover:bg-green-700">
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Convert project updates to the expected format
  const formattedUpdates: Update[] = updates.map((update, index) => ({
    id: index + 1,
    title: update.title,
    description: update.description,
    date: new Date(update.created_at).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    category: update.project_name || 'Unknown Project',
    image: update.image_url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop',
    content: update.update_text,
    media: update.image_url ? [{
      id: 1,
      image: update.image_url,
      title: update.title
    }] : [],
    isRead: false
  }));

  const newUpdates = formattedUpdates.filter(update => !update.isRead);
  const readUpdates = formattedUpdates.filter(update => update.isRead);

  const handleUpdateClick = (update: Update) => {
    setSelectedUpdate(update);
  };

  const handleMediaClick = (media: MediaItem) => {
    setSelectedMedia(media);
    setIsModalOpen(true);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Cassava 2025': 'bg-orange-100 text-orange-800',
      'Tomatoes 2025': 'bg-red-100 text-red-800',
      'Peppers 2025': 'bg-green-100 text-green-800',
      'Cucumbers 2025': 'bg-blue-100 text-blue-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Latest Updates</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-xs sm:text-sm text-gray-600">
                <span className="hidden sm:inline">Thursday, 18 September 2025 • 05:53 PM GMT</span>
                <span className="sm:hidden">Sep 18, 2025</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search updates... (min 4 chars)"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className={`w-full pl-10 pr-20 sm:pr-24 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                searchQuery.length > 0 && searchQuery.length < 4 ? 'border-orange-300 bg-orange-50' : 'border-gray-300'
              }`}
            />
            <div className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              {searchQuery.length > 0 && (
                <Button
                  onClick={handleClearSearch}
                  className="h-6 w-6 p-0"
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <Button
                onClick={handleSearchSubmit}
                disabled={searchQuery.length < 4 && searchQuery.length > 0}
                className="h-6 px-1 sm:px-2 text-xs"
                variant="ghost"
                size="sm"
              >
                <span className="hidden sm:inline">Search</span>
                <span className="sm:hidden">Go</span>
              </Button>
            </div>
            {searchQuery.length > 0 && searchQuery.length < 4 && (
              <p className="absolute -bottom-6 left-0 text-xs text-orange-600">
                Type {4 - searchQuery.length} more character{4 - searchQuery.length === 1 ? '' : 's'} to search
              </p>
            )}
          </div>
          
          {/* Active Search Indicator */}
          {filters.search && (
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Search: &quot;{filters.search}&quot;
              </Badge>
              <Button
                onClick={handleClearSearch}
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
          {/* Left Panel - Updates List */}
          <div className="w-full lg:w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
            {/* Tab Navigation */}
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <div className="flex space-x-1 overflow-x-auto">
                <Button
                  variant={activeTab === 'new' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('new')}
                  className={`px-3 sm:px-4 py-2 text-sm whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'new' 
                      ? 'bg-green-600 text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  New ({newUpdates.length})
                </Button>
                <Button
                  variant={activeTab === 'read' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('read')}
                  className={`px-3 sm:px-4 py-2 text-sm whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'read' 
                      ? 'bg-green-600 text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Read ({readUpdates.length})
                </Button>
              </div>
            </div>

            {/* Updates List */}
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
              <AnimatePresence>
                {(activeTab === 'new' ? newUpdates : readUpdates).map((update, index) => (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedUpdate?.id === update.id 
                        ? 'bg-green-50 border-green-200' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleUpdateClick(update)}
                  >
                    <Card className={`${
                      selectedUpdate?.id === update.id 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200'
                    }`}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex space-x-2 sm:space-x-3">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={update.image}
                              alt={update.title}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1 line-clamp-2">
                              {update.title}
                            </h3>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {update.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <span className="text-xs text-gray-500">{update.date}</span>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${getCategoryColor(update.category)}`}
                                >
                                  <span className="hidden sm:inline">{update.category}</span>
                                  <span className="sm:hidden">{update.category.split(' ')[0]}</span>
                                </Badge>
                              </div>
                              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Panel - Selected Update Details */}
          <div className="flex-1 bg-white overflow-y-auto">
            {selectedUpdate ? (
              <div className="p-4 sm:p-6">
                {/* Metadata Header */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{selectedUpdate.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">{selectedUpdate.category}</span>
                  </div>
                </div>

                {/* Main Title */}
                <h2 className="text-lg sm:text-2xl font-bold text-green-600 mb-4">
                  {selectedUpdate.title}
                </h2>

                {/* Description */}
                <div className="prose max-w-none mb-6">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    {selectedUpdate.content}
                  </p>
                </div>

                {/* Media Section */}
                {selectedUpdate.media && selectedUpdate.media.length > 0 && (
                  <div className="mt-6 sm:mt-8">
                    <h3 className="text-base sm:text-lg font-semibold text-green-600 mb-4">Media</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {selectedUpdate.media.map((media) => (
                        <motion.div
                          key={media.id}
                          whileHover={{ scale: 1.02 }}
                          className="cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                          onClick={() => handleMediaClick(media)}
                        >
                          <div className="aspect-square relative">
                            <Image
                              src={media.image}
                              alt={media.title}
                              width={300}
                              height={300}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-white bg-opacity-90 rounded-full p-2">
                                  <Play className="h-6 w-6 text-gray-700" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Update</h3>
                  <p className="text-gray-600">Choose an update from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Media Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle asChild>
                <VisuallyHidden>{selectedMedia?.title}</VisuallyHidden>
              </DialogTitle>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{selectedMedia?.title}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="p-6">
              {selectedMedia && (
                <div className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={selectedMedia.image}
                      alt={selectedMedia.title}
                      width={800}
                      height={450}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex space-x-2">
                    {selectedUpdate?.media.map((media) => (
                      <button
                        key={media.id}
                        onClick={() => setSelectedMedia(media)}
                        className={`w-16 h-16 rounded-lg overflow-hidden ${
                          selectedMedia.id === media.id 
                            ? 'ring-2 ring-green-500' 
                            : 'hover:opacity-80'
                        }`}
                      >
                        <Image
                          src={media.image}
                          alt={media.title}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default UpdatesPage;