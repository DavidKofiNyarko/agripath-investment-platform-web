'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import UserHeader from '@/components/user-header';
import { usePortfolio } from '@/contexts/PortfolioContext';
import type { Project } from '@/contexts/PortfolioContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Unused imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  // Bell, // Unused import
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FolderOpen,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Package,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

// Animation variants
// const timelineVariants = { // Unused variable
//   hidden: { opacity: 0, x: -20 },
//   visible: { 
//     opacity: 1, 
//     x: 0, 
//     transition: { duration: 0.5 }
//   }
// };

const stepVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      duration: 0.4,
      stiffness: 100
    }
  }
};

const progressVariants = {
  hidden: { scaleX: 0 },
  visible: { 
    scaleX: 1, 
    transition: { duration: 0.8 }
  }
};

// Project interface is imported from PortfolioContext

// Dynamic metrics will be calculated in the component

// Projects data now comes from PortfolioContext

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Completed':
    case 'Complete':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Complete</Badge>;
    case 'In progress':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">In progress</Badge>;
    case 'Canceled':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Canceled</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
  }
};

const PortfolioPage = () => {
  const { 
    projects, 
    metrics, 
    transactions, 
    loading, 
    error, 
    filters,
    setFilters,
    pagination,
    setPagination,
    refreshPortfolio 
  } = usePortfolio();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsDrawerOpen(true);
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  // Handle search
  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, currentPage: page });
  };

  // Apply client-side filtering
  const filteredProjects = projects.filter(project => {
    // Apply type filter
    if (filters.type !== 'All' && project.project_type !== filters.type) {
      return false;
    }
    
    // Apply status filter
    if (filters.status !== 'All' && project.status !== filters.status) {
      return false;
    }
    
    // Apply search filter
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.toLowerCase();
      return project.project_name.toLowerCase().includes(searchTerm);
    }
    
    return true;
  });

  // Apply pagination to filtered projects
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (pagination.currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading portfolio data...</p>
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
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Portfolio</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refreshPortfolio} className="bg-green-600 hover:bg-green-700">
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={`space-y-4 sm:space-y-6 px-4 sm:px-0 transition-all duration-300 ${isDrawerOpen ? 'main-content-blur' : ''}`}>
        {/* Header */}
        <UserHeader />

        {/* Page Title */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Portfolio</h2>
        </div>

        {/* Portfolio Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="bg-green-800 text-white">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-green-100 text-xs sm:text-sm font-medium mb-1">Total Invested</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">GHS {metrics?.total_invested?.toLocaleString() || '0.00'}</p>
                </div>
                <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-yellow-500 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-800 text-white">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-green-100 text-xs sm:text-sm font-medium mb-1">Expected Returns</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">GHS {metrics?.expected_returns?.toLocaleString() || '0.00'}</p>
                </div>
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-yellow-500 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-800 text-white">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-green-100 text-xs sm:text-sm font-medium mb-1">Active Projects</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">{metrics?.active_projects || 0}</p>
                </div>
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-500 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-800 text-white">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-green-100 text-xs sm:text-sm font-medium mb-1">Total Units</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">{metrics?.total_units || 0}</p>
                </div>
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-500 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {/* Filters */}
            <div className="p-4 sm:p-6 border-b bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="CROP">Crops</SelectItem>
                      <SelectItem value="LIVESTOCK">Livestock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Complete">Complete</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search projects..."
                      value={filters.search}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Table - Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Invested
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit(s)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedProjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <Package className="h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-lg font-medium">No investments yet</p>
                          <p className="text-sm">Start investing in agricultural projects to see them here</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {project.project_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          GHS {project.invested_amount?.toLocaleString() || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.units_owned || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.last_investment ? new Date(project.last_investment).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Progress value={75} className="flex-1 h-2" />
                            <span className="text-sm text-gray-600 w-12">75%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(project.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleProjectClick(project)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Projects Cards - Mobile */}
            <div className="lg:hidden">
              {paginatedProjects.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <Package className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No investments yet</p>
                    <p className="text-sm">Start investing in agricultural projects to see them here</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {paginatedProjects.map((project) => (
                    <Card key={project.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                              {project.project_name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {project.last_investment ? new Date(project.last_investment).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div className="ml-2">
                            {getStatusBadge(project.status)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Amount Invested</p>
                            <p className="font-medium text-gray-900">
                              GHS {project.invested_amount?.toLocaleString() || '0.00'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Units Owned</p>
                            <p className="font-medium text-gray-900">{project.units_owned || 0}</p>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>75%</span>
                          </div>
                          <Progress value={75} className="h-2" />
                        </div>
                        
                        <div className="flex justify-end pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleProjectClick(project)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="px-4 sm:px-6 py-4 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                  Showing {filteredProjects.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredProjects.length)} of {filteredProjects.length} projects
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={pagination.currentPage === 1}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={pagination.currentPage === page ? "default" : "outline"}
                          size="sm"
                          className={`h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs sm:text-sm ${
                            pagination.currentPage === page 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : 'text-gray-600'
                          }`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={pagination.currentPage === totalPages}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Details Drawer */}
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-y-auto">
            {selectedProject && (
              <div className="h-full flex flex-col">
                <SheetHeader className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-xl font-semibold">Investment Summary</SheetTitle>
                    <Badge className={`${
                      selectedProject.status === 'In progress' 
                        ? 'bg-orange-100 text-orange-800' 
                        : selectedProject.status === 'Complete' || selectedProject.status === 'Complete'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedProject.status.toUpperCase()}
                    </Badge>
                  </div>
                </SheetHeader>
                
                <div className="flex-1 p-6 space-y-6">
                  <img 
                    src={selectedProject.cover_image_url}
                    alt={selectedProject.project_name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Amount Invested</p>
                      <p className="font-bold text-lg">GHS {selectedProject.amount?.toLocaleString() || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Return (ROI)</p>
                      <p className="font-bold text-lg text-orange-600">{selectedProject.roi}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-bold text-lg text-orange-600">{selectedProject.duration}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Project Progress</span>
                      <span className="text-sm text-gray-600">{selectedProject.progress}% there</span>
                    </div>
                    <div className="relative">
                      <Progress value={selectedProject.progress} className="h-2" />
                      <motion.div
                        className="absolute top-0 left-0 h-2 bg-green-600 rounded-full"
                        variants={progressVariants}
                        initial="hidden"
                        animate="visible"
                        style={{ 
                          width: `${selectedProject.progress}%`,
                          transformOrigin: 'left'
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Project</span>
                      <span className="font-semibold">{selectedProject.project_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Potential Return</span>
                      <span className="font-semibold text-green-600">{selectedProject.potentialReturn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Units Selected</span>
                      <span className="font-semibold">{selectedProject.units} Unit(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date</span>
                      <span className="font-semibold">{selectedProject.endDate}</span>
                    </div>
                  </div>

                  {/* Project Timeline */}
                  {selectedProject.timeline && selectedProject.timeline.length > 0 && (
                    <div>
                      <Button
                        variant="ghost"
                        onClick={() => setShowTimeline(!showTimeline)}
                        className="w-full justify-between p-0 h-auto"
                      >
                        <span className="font-semibold">Project Timeline</span>
                        {showTimeline ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      
                      <AnimatePresence>
                        {showTimeline && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="mt-4 space-y-4"
                          >
                            {selectedProject.timeline.map((item: { step: string; date: string; completed: boolean; current?: boolean }, index: number) => (
                              <motion.div
                                key={index}
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: index * 0.1 }}
                                className="flex items-start gap-3"
                              >
                                <div className="flex flex-col items-center">
                                  <motion.div 
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                      item.completed 
                                        ? 'bg-green-600' 
                                        : item.current 
                                        ? 'bg-green-600 border-2 border-green-600' 
                                        : 'bg-white border-2 border-gray-300'
                                    }`}
                                    whileHover={{ scale: 1.1 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                  >
                                    {item.completed && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                                      >
                                        <CheckCircle className="h-4 w-4 text-white" />
                                      </motion.div>
                                    )}
                                    {item.current && !item.completed && (
                                      <motion.div 
                                        className="w-2 h-2 bg-white rounded-full"
                                        animate={{ 
                                          scale: [1, 1.2, 1],
                                          opacity: [1, 0.7, 1]
                                        }}
                                        transition={{ 
                                          duration: 2,
                                          repeat: Infinity,
                                          ease: "easeInOut"
                                        }}
                                      />
                                    )}
                                  </motion.div>
                                  {index < (selectedProject.timeline?.length || 0) - 1 && (
                                    <motion.div 
                                      className={`w-0.5 h-8 mt-2 ${
                                        item.completed ? 'bg-green-600' : 'bg-gray-300'
                                      }`}
                                      initial={{ scaleY: 0 }}
                                      animate={{ scaleY: 1 }}
                                      transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                                      style={{ transformOrigin: 'top' }}
                                    />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <motion.p 
                                    className={`font-medium ${
                                      item.completed || item.current ? 'text-gray-900' : 'text-gray-500'
                                    }`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + index * 0.1 }}
                                  >
                                    {item.step}
                                  </motion.p>
                                  <motion.p 
                                    className="text-sm text-gray-500"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 + index * 0.1 }}
                                  >
                                    {item.date}
                                  </motion.p>
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
};

export default PortfolioPage;
