"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Image from "next/image";
import {
  ChevronRight,
  X,
  Play,
  Calendar,
  FolderOpen,
  Search,
  ArrowLeft,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import UserHeader from "@/components/user-header";
import { useUpdates } from "@/contexts/UpdatesContext";
import { useNotifications } from "@/contexts/NotificationContext";
import Loading from "@/components/ui/loading";

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
  const { updates, loading, error, filters, setFilters, refreshUpdates } =
    useUpdates();

  const {
    notifications,
    unreadCount,
    markAsRead,
    isLoading: notificationsLoading,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState("notifications");
  const [selectedUpdate, setSelectedUpdate] = useState<Update | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDetailView, setShowDetailView] = useState(false);

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
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setFilters({ ...filters, search: "" });
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <Loading size="lg" className="min-h-screen" />
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Updates
            </h3>
            <p className="text-gray-600 mb-4 text-sm">{error}</p>
            <Button
              onClick={refreshUpdates}
              className="bg-green-600 hover:bg-green-700"
            >
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
    date: new Date(update.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    category: update.project_name || "Unknown Project",
    image:
      update.image_url ||
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop",
    content: update.update_text,
    media: update.image_url
      ? [
          {
            id: 1,
            image: update.image_url,
            title: update.title,
          },
        ]
      : [],
    isRead: false,
  }));

  const newUpdates = formattedUpdates.filter((update) => !update.isRead);
  const readUpdates = formattedUpdates.filter((update) => update.isRead);

  // Pagination logic
  const getPaginatedItems = (items: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = (items: any[]) => {
    return Math.ceil(items.length / itemsPerPage);
  };

  const paginatedNotifications = getPaginatedItems(notifications);
  const paginatedUpdates = getPaginatedItems(newUpdates);
  const totalNotificationPages = getTotalPages(notifications);
  const totalUpdatePages = getTotalPages(newUpdates);

  const handleUpdateClick = (update: Update) => {
    setSelectedUpdate(update);
    setShowDetailView(true);
  };

  const handleMediaClick = (media: MediaItem) => {
    setSelectedMedia(media);
    setIsModalOpen(true);
  };

  const handleNotificationClick = async (notification: any) => {
    setSelectedNotification(notification);
    setIsNotificationModalOpen(true);
    setShowDetailView(true);

    // Mark as read if it's unread
    if (notification.status === "unread") {
      await markAsRead(notification.id);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when switching tabs
    setSelectedUpdate(null);
    setSelectedNotification(null);
    setShowDetailView(false);
  };

  const handleBackToList = () => {
    setShowDetailView(false);
    setSelectedUpdate(null);
    setSelectedNotification(null);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Cassava 2025": "bg-orange-100 text-orange-800",
      "Tomatoes 2025": "bg-red-100 text-red-800",
      "Peppers 2025": "bg-green-100 text-green-800",
      "Cucumbers 2025": "bg-blue-100 text-blue-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-4">
        <UserHeader title="Latest Updates" />
      </div>
      <div className="min-h-screen ">
        {/* User Header */}

        {/* Header */}
        <div className=" border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
          <div className="flex flex-col gap-3">
            {/* Top row with title and bell */}
            <div className="flex items-center justify-between rounded-lg">
              {showDetailView ? (
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToList}
                    className="p-1 lg:hidden"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h1 className="text-lg font-bold text-gray-900 truncate">
                    {selectedNotification ? "Notification" : "Update Details"}
                  </h1>
                </div>
              ) : (
                <h1 className="text-xl font-bold text-gray-900">
                  Latest Updates
                </h1>
              )}
            </div>

            {/* Search Bar - only show on list view */}
            {!showDetailView && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search updates..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className={`w-full pl-10 pr-20 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    searchQuery.length > 0 && searchQuery.length < 4
                      ? "border-orange-300 bg-orange-50"
                      : "border-gray-300"
                  }`}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
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
                    className="h-6 px-2 text-xs"
                    variant="ghost"
                    size="sm"
                  >
                    Go
                  </Button>
                </div>
                {searchQuery.length > 0 && searchQuery.length < 4 && (
                  <p className="absolute -bottom-5 left-0 text-xs text-orange-600">
                    Type {4 - searchQuery.length} more character
                    {4 - searchQuery.length === 1 ? "" : "s"} to search
                  </p>
                )}
              </div>
            )}

            {/* Active Search Indicator */}
            {filters.search && !showDetailView && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
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
        </div>

        <div className="flex h-[calc(100vh-120px)]">
          {/* Left Panel - Updates List */}
          <div
            className={`w-full lg:w-1/3 border-r border-gray-200 bg-white overflow-y-auto ${
              showDetailView ? "hidden lg:block" : "block"
            }`}
          >
            {/* Tab Navigation */}
            <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex space-x-1">
                <Button
                  variant={activeTab === "notifications" ? "default" : "ghost"}
                  onClick={() => handleTabChange("notifications")}
                  className={`flex-1 py-2.5 text-sm ${
                    activeTab === "notifications"
                      ? "bg-green-600 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Notifications ({notifications.length})
                </Button>
                <Button
                  variant={activeTab === "new" ? "default" : "ghost"}
                  onClick={() => handleTabChange("new")}
                  className={`flex-1 py-2.5 text-sm ${
                    activeTab === "new"
                      ? "bg-green-600 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Updates ({newUpdates.length})
                </Button>
              </div>
            </div>

            {/* Content List */}
            <div className="p-4 space-y-3 pb-20">
              {activeTab === "notifications" ? (
                notificationsLoading ? (
                  <div className="text-center py-8">
                    <Loading size="sm" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No notifications yet</p>
                  </div>
                ) : (
                  paginatedNotifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`cursor-pointer transition-colors duration-150 ${
                        selectedNotification?.id === notification.id
                          ? "bg-green-50 border-green-200"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <Card
                        className={`${
                          selectedNotification?.id === notification.id
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200"
                        }`}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${
                                    notification.type === "Email"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {notification.type}
                                </Badge>
                                {notification.status === "unread" && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 line-clamp-2">
                                {notification.title}
                              </h3>
                              <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">
                                {notification.body}
                              </p>
                              <p className="text-gray-500 text-xs mt-2">
                                {new Date(
                                  notification.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))
                )
              ) : (
                paginatedUpdates.map((update, index) => (
                  <div
                    key={update.id}
                    className={`cursor-pointer transition-colors duration-150 ${
                      selectedUpdate?.id === update.id
                        ? "bg-green-50 border-green-200"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleUpdateClick(update)}
                  >
                    <Card
                      className={`${
                        selectedUpdate?.id === update.id
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200"
                      }`}
                    >
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
                                <span className="text-xs text-gray-500">
                                  {update.date}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${getCategoryColor(
                                    update.category
                                  )}`}
                                >
                                  <span className="hidden sm:inline">
                                    {update.category}
                                  </span>
                                  <span className="sm:hidden">
                                    {update.category.split(" ")[0]}
                                  </span>
                                </Badge>
                              </div>
                              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {((activeTab === "notifications" && totalNotificationPages > 1) ||
              (activeTab === "new" && totalUpdatePages > 1)) && (
              <div className="p-3 sm:p-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of{" "}
                    {activeTab === "notifications"
                      ? totalNotificationPages
                      : totalUpdatePages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={
                        currentPage ===
                        (activeTab === "notifications"
                          ? totalNotificationPages
                          : totalUpdatePages)
                      }
                      className="px-3 py-1 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Selected Content Details */}
          <div className="flex-1 bg-white overflow-y-auto">
            {selectedNotification ? (
              <div className="p-4 sm:p-6">
                {/* Notification Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={`${
                        selectedNotification.type === "Email"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {selectedNotification.type}
                    </Badge>
                    {selectedNotification.status === "unread" && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsNotificationModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Notification Title */}
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                  {selectedNotification.title}
                </h1>

                {/* Notification Content */}
                <div className="prose max-w-none mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedNotification.body}
                    </p>
                  </div>
                </div>

                {/* Notification Metadata */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Received on{" "}
                      {new Date(
                        selectedNotification.created_at
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ) : selectedUpdate ? (
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
                {selectedUpdate.media && selectedUpdate.media.length > 0 ? (
                  <div className="mt-6 sm:mt-8">
                    <h3 className="text-base sm:text-lg font-semibold text-green-600 mb-4">
                      Media
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {selectedUpdate.media.map((media) => (
                        <div
                          key={media.id}
                          className="cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-150 bg-gray-100"
                          onClick={() => handleMediaClick(media)}
                        >
                          <div className="aspect-square relative bg-gray-100">
                            <Image
                              src={media.image}
                              alt={media.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 50vw"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-white bg-opacity-90 rounded-full p-2">
                                  <Play className="h-6 w-6 text-gray-700" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedUpdate.image &&
                  selectedUpdate.image !==
                    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop" ? (
                  <div className="mt-6 sm:mt-8">
                    <h3 className="text-base sm:text-lg font-semibold text-green-600 mb-4">
                      Media
                    </h3>
                    <div className="rounded-lg overflow-hidden shadow-sm bg-gray-100">
                      <div className="aspect-video relative">
                        <Image
                          src={selectedUpdate.image}
                          alt={selectedUpdate.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 80vw"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {activeTab === "notifications"
                      ? "Select a Notification"
                      : "Select an Update"}
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === "notifications"
                      ? "Choose a notification from the list to view details"
                      : "Choose an update from the list to view details"}
                  </p>
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
                <h2 className="text-lg font-semibold">
                  {selectedMedia?.title}
                </h2>
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
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 relative">
                    <Image
                      src={selectedMedia.image}
                      alt={selectedMedia.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
                    />
                  </div>
                  {selectedUpdate?.media && selectedUpdate.media.length > 1 && (
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {selectedUpdate.media.map((media) => (
                        <button
                          key={media.id}
                          onClick={() => setSelectedMedia(media)}
                          className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 ${
                            selectedMedia.id === media.id
                              ? "ring-2 ring-green-500"
                              : "hover:opacity-80"
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
                  )}
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
