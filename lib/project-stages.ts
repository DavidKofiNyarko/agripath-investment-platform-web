/**
 * PROJECT STAGES SYSTEM - COMPLETE REFERENCE GUIDE
 * ==================================================
 *
 * This file contains the complete project stages system with all project types,
 * stages, and utility functions for managing project timelines with automatic
 * date calculations.
 */

export type ProjectType = "CROP" | "LIVESTOCK" | "POULTRY" | "AQUACULTURE";

export type ProjectStage =
  // CROP PROJECTS (7 Stages)
  | "LAND_PREPARATION"
  | "PLANTING"
  | "CROP_MANAGEMENT"
  | "GROWTH_MONITORING"
  | "HARVESTING"
  | "PROCESSING_SALES"
  | "PAYOUT_CLOSURE"
  // LEGACY CROP STAGES (for backward compatibility with database ENUM)
  | "IRRIGATION"
  | "TRANSPLANTING"
  | "FERTILIZER_APPLICATION"
  | "PEST_MANAGEMENT"
  | "FRUITING"
  | "SALES"
  // LIVESTOCK PROJECTS (6 Stages)
  | "HOUSING_PEN_SETUP"
  | "STOCKING_ANIMAL_PURCHASE"
  | "FEEDING_HEALTH_MANAGEMENT"
  | "GROWTH_MONITORING_LIVESTOCK"
  | "PROCESSING_SALES_LIVESTOCK"
  | "PAYOUT_CLOSURE_LIVESTOCK"
  // POULTRY PROJECTS (6 Stages)
  | "BROODING_SETUP"
  | "CHICK_ARRIVAL_ONBOARDING"
  | "FEEDING_GROWTH_MONITORING"
  | "PRODUCTION_HARVEST_STAGE"
  | "SALES_POULTRY"
  | "PAYOUT_CLOSURE_POULTRY"
  // AQUACULTURE PROJECTS (7 Stages)
  | "POND_TANK_SETUP"
  | "FINGERLINGS_STOCKING"
  | "FEEDING_WATER_MANAGEMENT"
  | "GROWTH_PHASE"
  | "HARVESTING_AQUACULTURE"
  | "SALES_AQUACULTURE"
  | "PAYOUT_CLOSURE_AQUACULTURE";

export interface ProjectStageInfo {
  id: ProjectStage;
  displayName: string;
  description: string;
  order: number;
  estimatedDurationDays: number; // Duration in days for this stage
  estimatedDurationWeeks: number; // Duration in weeks for this stage
}

export interface ProjectTimelineInfo {
  id: ProjectStage;
  displayName: string;
  description: string;
  order: number;
  estimatedDurationDays: number;
  estimatedDurationWeeks: number;
  isCurrent: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface ProjectDateCalculation {
  totalDurationDays: number;
  totalDurationWeeks: number;
  totalDurationMonths: number;
  startDate: Date;
  endDate: Date;
  stages: ProjectTimelineInfo[];
}

// CROP PROJECTS (7 Stages) - Duration estimates based on typical crop cycles
const CROP_STAGES: ProjectStageInfo[] = [
  {
    id: "LAND_PREPARATION",
    displayName: "Land Preparation",
    description: "Clearing, tilling, and preparing the land for planting",
    order: 1,
    estimatedDurationDays: 14,
    estimatedDurationWeeks: 2,
  },
  {
    id: "PLANTING",
    displayName: "Planting",
    description: "Sowing seeds or planting seedlings in prepared land",
    order: 2,
    estimatedDurationDays: 7,
    estimatedDurationWeeks: 1,
  },
  {
    id: "CROP_MANAGEMENT",
    displayName: "Crop Management",
    description:
      "Ongoing care including irrigation, fertilization, and pest control",
    order: 3,
    estimatedDurationDays: 60,
    estimatedDurationWeeks: 8,
  },
  {
    id: "GROWTH_MONITORING",
    displayName: "Growth & Monitoring",
    description: "Tracking crop development, health, and performance metrics",
    order: 4,
    estimatedDurationDays: 90,
    estimatedDurationWeeks: 13,
  },
  {
    id: "HARVESTING",
    displayName: "Harvesting",
    description: "Collecting mature crops at optimal timing",
    order: 5,
    estimatedDurationDays: 14,
    estimatedDurationWeeks: 2,
  },
  {
    id: "PROCESSING_SALES",
    displayName: "Processing / Sales",
    description: "Processing crops and marketing to buyers",
    order: 6,
    estimatedDurationDays: 21,
    estimatedDurationWeeks: 3,
  },
  {
    id: "PAYOUT_CLOSURE",
    displayName: "Payout & Closure",
    description: "Final sales distribution and project completion",
    order: 7,
    estimatedDurationDays: 7,
    estimatedDurationWeeks: 1,
  },
];

// LIVESTOCK PROJECTS (6 Stages) - Duration estimates based on typical livestock cycles
const LIVESTOCK_STAGES: ProjectStageInfo[] = [
  {
    id: "HOUSING_PEN_SETUP",
    displayName: "Housing / Pen Setup",
    description: "Building and preparing animal housing facilities and pens",
    order: 1,
    estimatedDurationDays: 21,
    estimatedDurationWeeks: 3,
  },
  {
    id: "STOCKING_ANIMAL_PURCHASE",
    displayName: "Stocking / Animal Purchase",
    description: "Acquiring and introducing animals to the facility",
    order: 2,
    estimatedDurationDays: 7,
    estimatedDurationWeeks: 1,
  },
  {
    id: "FEEDING_HEALTH_MANAGEMENT",
    displayName: "Feeding & Health Management",
    description: "Daily feeding, health monitoring, and veterinary care",
    order: 3,
    estimatedDurationDays: 120,
    estimatedDurationWeeks: 17,
  },
  {
    id: "GROWTH_MONITORING_LIVESTOCK",
    displayName: "Growth & Monitoring",
    description: "Tracking animal development, weight gain, and health metrics",
    order: 4,
    estimatedDurationDays: 90,
    estimatedDurationWeeks: 13,
  },
  {
    id: "PROCESSING_SALES_LIVESTOCK",
    displayName: "Processing / Sales",
    description: "Preparing animals for market or processing facilities",
    order: 5,
    estimatedDurationDays: 14,
    estimatedDurationWeeks: 2,
  },
  {
    id: "PAYOUT_CLOSURE_LIVESTOCK",
    displayName: "Payout & Closure",
    description: "Final sales distribution and project completion",
    order: 6,
    estimatedDurationDays: 7,
    estimatedDurationWeeks: 1,
  },
];

// POULTRY PROJECTS (6 Stages) - Duration estimates based on typical poultry cycles
const POULTRY_STAGES: ProjectStageInfo[] = [
  {
    id: "BROODING_SETUP",
    displayName: "Brooding Setup",
    description: "Preparing facilities and equipment for young chicks",
    order: 1,
    estimatedDurationDays: 7,
    estimatedDurationWeeks: 1,
  },
  {
    id: "CHICK_ARRIVAL_ONBOARDING",
    displayName: "Chick Arrival & Onboarding",
    description: "Receiving, acclimating, and settling new chicks",
    order: 2,
    estimatedDurationDays: 3,
    estimatedDurationWeeks: 1,
  },
  {
    id: "FEEDING_GROWTH_MONITORING",
    displayName: "Feeding & Growth Monitoring",
    description: "Daily feeding, monitoring chick development and health",
    order: 3,
    estimatedDurationDays: 35,
    estimatedDurationWeeks: 5,
  },
  {
    id: "PRODUCTION_HARVEST_STAGE",
    displayName: "Production / Harvest Stage",
    description: "Egg production for layers or meat processing for broilers",
    order: 4,
    estimatedDurationDays: 42,
    estimatedDurationWeeks: 6,
  },
  {
    id: "SALES_POULTRY",
    displayName: "Sales",
    description: "Marketing and selling poultry products (eggs or meat)",
    order: 5,
    estimatedDurationDays: 14,
    estimatedDurationWeeks: 2,
  },
  {
    id: "PAYOUT_CLOSURE_POULTRY",
    displayName: "Payout & Closure",
    description: "Final sales distribution and project completion",
    order: 6,
    estimatedDurationDays: 7,
    estimatedDurationWeeks: 1,
  },
];

// AQUACULTURE PROJECTS (7 Stages) - Duration estimates based on typical fish farming cycles
const AQUACULTURE_STAGES: ProjectStageInfo[] = [
  {
    id: "POND_TANK_SETUP",
    displayName: "Pond / Tank Setup",
    description:
      "Preparing water bodies, tanks, and equipment for fish farming",
    order: 1,
    estimatedDurationDays: 21,
    estimatedDurationWeeks: 3,
  },
  {
    id: "FINGERLINGS_STOCKING",
    displayName: "Fingerlings Stocking",
    description: "Introducing young fish to the pond or tank system",
    order: 2,
    estimatedDurationDays: 7,
    estimatedDurationWeeks: 1,
  },
  {
    id: "FEEDING_WATER_MANAGEMENT",
    displayName: "Feeding & Water Management",
    description: "Daily feeding and maintaining optimal water quality",
    order: 3,
    estimatedDurationDays: 120,
    estimatedDurationWeeks: 17,
  },
  {
    id: "GROWTH_PHASE",
    displayName: "Growth Phase",
    description: "Monitoring fish development, health, and growth rates",
    order: 4,
    estimatedDurationDays: 90,
    estimatedDurationWeeks: 13,
  },
  {
    id: "HARVESTING_AQUACULTURE",
    displayName: "Harvesting",
    description: "Catching and processing mature fish",
    order: 5,
    estimatedDurationDays: 14,
    estimatedDurationWeeks: 2,
  },
  {
    id: "SALES_AQUACULTURE",
    displayName: "Sales",
    description: "Marketing and selling fish products",
    order: 6,
    estimatedDurationDays: 21,
    estimatedDurationWeeks: 3,
  },
  {
    id: "PAYOUT_CLOSURE_AQUACULTURE",
    displayName: "Payout & Closure",
    description: "Final sales distribution and project completion",
    order: 7,
    estimatedDurationDays: 7,
    estimatedDurationWeeks: 1,
  },
];

// Stage mapping by project type
const STAGES_BY_TYPE: Record<ProjectType, ProjectStageInfo[]> = {
  CROP: CROP_STAGES,
  LIVESTOCK: LIVESTOCK_STAGES,
  POULTRY: POULTRY_STAGES,
  AQUACULTURE: AQUACULTURE_STAGES,
};

// LEGACY CROP STAGES (for backward compatibility with database ENUM)
// These stages exist in the database but are mapped to new stages
const LEGACY_CROP_STAGES: ProjectStageInfo[] = [
  {
    id: "IRRIGATION",
    displayName: "Irrigation",
    description:
      "Watering and irrigation management (legacy stage - maps to Crop Management)",
    order: 3,
    estimatedDurationDays: 60,
    estimatedDurationWeeks: 8,
  },
  {
    id: "TRANSPLANTING",
    displayName: "Transplanting",
    description:
      "Moving seedlings to final location (legacy stage - maps to Crop Management)",
    order: 3,
    estimatedDurationDays: 7,
    estimatedDurationWeeks: 1,
  },
  {
    id: "FERTILIZER_APPLICATION",
    displayName: "Fertilizer Application",
    description:
      "Applying nutrients to crops (legacy stage - maps to Crop Management)",
    order: 3,
    estimatedDurationDays: 60,
    estimatedDurationWeeks: 8,
  },
  {
    id: "PEST_MANAGEMENT",
    displayName: "Pest Management",
    description:
      "Controlling pests and diseases (legacy stage - maps to Crop Management)",
    order: 3,
    estimatedDurationDays: 60,
    estimatedDurationWeeks: 8,
  },
  {
    id: "FRUITING",
    displayName: "Fruiting",
    description:
      "Crop fruiting and development (legacy stage - maps to Growth & Monitoring)",
    order: 4,
    estimatedDurationDays: 90,
    estimatedDurationWeeks: 13,
  },
  {
    id: "SALES",
    displayName: "Sales",
    description:
      "Marketing and selling products (legacy stage - maps to Processing / Sales)",
    order: 6,
    estimatedDurationDays: 21,
    estimatedDurationWeeks: 3,
  },
];

// All stages combined for easy lookup (includes legacy stages for backward compatibility)
const ALL_STAGES: ProjectStageInfo[] = [
  ...CROP_STAGES,
  ...LEGACY_CROP_STAGES,
  ...LIVESTOCK_STAGES,
  ...POULTRY_STAGES,
  ...AQUACULTURE_STAGES,
];

// Old to new stage mappings for backward compatibility
const OLD_TO_NEW_MAPPINGS: Record<string, ProjectStage> = {
  IRRIGATION: "CROP_MANAGEMENT",
  TRANSPLANTING: "CROP_MANAGEMENT",
  FERTILIZER_APPLICATION: "CROP_MANAGEMENT",
  PEST_MANAGEMENT: "CROP_MANAGEMENT",
  FRUITING: "GROWTH_MONITORING",
  SALES: "PROCESSING_SALES",
  // Ensure all current stages are properly mapped
  LAND_PREPARATION: "LAND_PREPARATION",
  PLANTING: "PLANTING",
  CROP_MANAGEMENT: "CROP_MANAGEMENT",
  GROWTH_MONITORING: "GROWTH_MONITORING",
  HARVESTING: "HARVESTING",
  PROCESSING_SALES: "PROCESSING_SALES",
  PAYOUT_CLOSURE: "PAYOUT_CLOSURE",
};

/**
 * Get all stages for a specific project type
 */
export function getStagesForProjectType(
  projectType: ProjectType
): ProjectStageInfo[] {
  return STAGES_BY_TYPE[projectType] || [];
}

/**
 * Get the first stage for a project type
 */
export function getFirstStage(
  projectType: ProjectType
): ProjectStageInfo | null {
  const stages = getStagesForProjectType(projectType);
  return stages.length > 0 ? stages[0] : null;
}

/**
 * Get stage information by stage ID
 */
export function getStageById(stageId: ProjectStage): ProjectStageInfo | null {
  return ALL_STAGES.find((stage) => stage.id === stageId) || null;
}

/**
 * Get the next stage for a given current stage and project type
 */
export function getNextStage(
  currentStageId: ProjectStage,
  projectType: ProjectType
): ProjectStageInfo | null {
  const stages = getStagesForProjectType(projectType);
  const currentIndex = stages.findIndex((stage) => stage.id === currentStageId);

  if (currentIndex === -1 || currentIndex >= stages.length - 1) {
    return null;
  }

  return stages[currentIndex + 1];
}

/**
 * Get the previous stage for a given current stage and project type
 */
export function getPreviousStage(
  currentStageId: ProjectStage,
  projectType: ProjectType
): ProjectStageInfo | null {
  const stages = getStagesForProjectType(projectType);
  const currentIndex = stages.findIndex((stage) => stage.id === currentStageId);

  if (currentIndex <= 0) {
    return null;
  }

  return stages[currentIndex - 1];
}

/**
 * Check if a stage is valid for a specific project type
 */
export function isValidStageForProjectType(
  stageId: ProjectStage,
  projectType: ProjectType
): boolean {
  const stages = getStagesForProjectType(projectType);
  return stages.some((stage) => stage.id === stageId);
}

/**
 * Format stage name for display
 */
export function formatStageName(stageId: ProjectStage): string {
  const stage = getStageById(stageId);
  return stage ? stage.displayName : stageId;
}

/**
 * Get stage description
 */
export function getStageDescription(stageId: ProjectStage): string {
  const stage = getStageById(stageId);
  return stage ? stage.description : "";
}

/**
 * Map old stage names to new stage names for backward compatibility
 */
export function mapOldStageToNew(oldStage: string): ProjectStage {
  return OLD_TO_NEW_MAPPINGS[oldStage] || (oldStage as ProjectStage);
}

/**
 * Get project timeline with current stage highlighted
 */
export function getProjectTimeline(
  projectType: ProjectType,
  currentStage?: ProjectStage
) {
  const stages = getStagesForProjectType(projectType);

  return stages.map((stage) => ({
    ...stage,
    isCurrent: stage.id === currentStage,
    isCompleted: currentStage
      ? stages.findIndex((s) => s.id === currentStage) >= stage.order
      : false,
    isUpcoming: currentStage
      ? stages.findIndex((s) => s.id === currentStage) < stage.order
      : true,
  }));
}

/**
 * Calculate project progress percentage based on current stage
 */
export function calculateProjectProgress(
  projectType: ProjectType,
  currentStage?: ProjectStage
): number {
  if (!currentStage) return 0;

  const stages = getStagesForProjectType(projectType);
  const currentIndex = stages.findIndex((stage) => stage.id === currentStage);

  if (currentIndex === -1) return 0;

  return Math.round(((currentIndex + 1) / stages.length) * 100);
}

/**
 * Get stage color for UI display
 */
export function getStageColor(
  stage: ProjectStageInfo,
  isCurrent: boolean,
  isCompleted: boolean
): string {
  if (isCompleted) return "text-green-600 bg-green-50 border-green-200";
  if (isCurrent) return "text-blue-600 bg-blue-50 border-blue-200";
  return "text-gray-600 bg-gray-50 border-gray-200";
}

/**
 * Get stage icon for UI display
 */
export function getStageIcon(stageId: ProjectStage): string {
  const iconMap: Record<string, string> = {
    // Crop stages
    LAND_PREPARATION: "🚜",
    PLANTING: "🌱",
    CROP_MANAGEMENT: "🌿",
    GROWTH_MONITORING: "📊",
    HARVESTING: "🌾",
    PROCESSING_SALES: "💰",
    PAYOUT_CLOSURE: "✅",

    // Legacy crop stages
    IRRIGATION: "💧",
    TRANSPLANTING: "🌱",
    FERTILIZER_APPLICATION: "🌿",
    PEST_MANAGEMENT: "🛡️",
    FRUITING: "🍎",
    SALES: "💰",

    // Livestock stages
    HOUSING_PEN_SETUP: "🏠",
    STOCKING_ANIMAL_PURCHASE: "🐄",
    FEEDING_HEALTH_MANAGEMENT: "🍽️",
    GROWTH_MONITORING_LIVESTOCK: "📈",
    PROCESSING_SALES_LIVESTOCK: "🥩",
    PAYOUT_CLOSURE_LIVESTOCK: "✅",

    // Poultry stages
    BROODING_SETUP: "🏠",
    CHICK_ARRIVAL_ONBOARDING: "🐣",
    FEEDING_GROWTH_MONITORING: "🌾",
    PRODUCTION_HARVEST_STAGE: "🥚",
    SALES_POULTRY: "💰",
    PAYOUT_CLOSURE_POULTRY: "✅",

    // Aquaculture stages
    POND_TANK_SETUP: "🏞️",
    FINGERLINGS_STOCKING: "🐟",
    FEEDING_WATER_MANAGEMENT: "💧",
    GROWTH_PHASE: "📊",
    HARVESTING_AQUACULTURE: "🎣",
    SALES_AQUACULTURE: "💰",
    PAYOUT_CLOSURE_AQUACULTURE: "✅",
  };

  return iconMap[stageId] || "📋";
}

/**
 * Calculate project dates based on project type and start date
 */
export function calculateProjectDates(
  projectType: ProjectType,
  startDate: Date,
  currentStage?: ProjectStage,
  projectStatus?: string
): ProjectDateCalculation {
  const stages = getStagesForProjectType(projectType);

  // Calculate total duration
  const totalDurationDays = stages.reduce(
    (total, stage) => total + stage.estimatedDurationDays,
    0
  );
  const totalDurationWeeks = Math.round(totalDurationDays / 7);
  const totalDurationMonths = Math.round(totalDurationDays / 30);

  // Calculate end date
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + totalDurationDays);

  // Generate timeline with dates
  const timelineStages: ProjectTimelineInfo[] = stages.map((stage, index) => {
    // Calculate stage start date
    const stageStartDate = new Date(startDate);
    const daysBeforeThisStage = stages
      .slice(0, index)
      .reduce((total, s) => total + s.estimatedDurationDays, 0);
    stageStartDate.setDate(stageStartDate.getDate() + daysBeforeThisStage);

    // Calculate stage end date
    const stageEndDate = new Date(stageStartDate);
    stageEndDate.setDate(stageEndDate.getDate() + stage.estimatedDurationDays);

    // Determine stage status - stages must be completed sequentially
    const currentStageIndex = currentStage
      ? stages.findIndex((s) => s.id === currentStage)
      : -1;
    const isProjectCompleted =
      projectStatus === "Completed" || projectStatus === "Complete";

    // For completed projects, all stages are completed
    const isCompleted = isProjectCompleted || currentStageIndex >= stage.order;
    const isCurrent = !isProjectCompleted && currentStage === stage.id;
    const isUpcoming = !isProjectCompleted && currentStageIndex < stage.order;

    return {
      ...stage,
      isCurrent,
      isCompleted,
      isUpcoming,
      startDate: stageStartDate,
      endDate: stageEndDate,
    };
  });

  return {
    totalDurationDays,
    totalDurationWeeks,
    totalDurationMonths,
    startDate,
    endDate,
    stages: timelineStages,
  };
}

/**
 * Get project duration in months (for backward compatibility)
 */
export function getProjectDurationMonths(projectType: ProjectType): number {
  const stages = getStagesForProjectType(projectType);
  const totalDurationDays = stages.reduce(
    (total, stage) => total + stage.estimatedDurationDays,
    0
  );
  return Math.round(totalDurationDays / 30);
}

/**
 * Format duration for display
 */
export function formatProjectDuration(projectType: ProjectType): string {
  const months = getProjectDurationMonths(projectType);
  if (months === 1) return "1 month";
  if (months < 12) return `${months} months`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    return years === 1 ? "1 year" : `${years} years`;
  }

  return `${years} year${years > 1 ? "s" : ""} ${remainingMonths} month${
    remainingMonths > 1 ? "s" : ""
  }`;
}

/**
 * Get estimated end date for a project
 */
export function getProjectEndDate(
  projectType: ProjectType,
  startDate: Date
): Date {
  const stages = getStagesForProjectType(projectType);
  const totalDurationDays = stages.reduce(
    (total, stage) => total + stage.estimatedDurationDays,
    0
  );

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + totalDurationDays);

  return endDate;
}

/**
 * Check if a project is overdue
 */
export function isProjectOverdue(
  projectType: ProjectType,
  startDate: Date,
  currentStage?: ProjectStage
): boolean {
  const endDate = getProjectEndDate(projectType, startDate);
  const now = new Date();

  // If we have a current stage, check if we're past the expected date for that stage
  if (currentStage) {
    const stages = getStagesForProjectType(projectType);
    const currentStageIndex = stages.findIndex((s) => s.id === currentStage);

    if (currentStageIndex >= 0) {
      const expectedDaysForCurrentStage = stages
        .slice(0, currentStageIndex + 1)
        .reduce((total, stage) => total + stage.estimatedDurationDays, 0);
      const expectedDateForCurrentStage = new Date(startDate);
      expectedDateForCurrentStage.setDate(
        expectedDateForCurrentStage.getDate() + expectedDaysForCurrentStage
      );

      return now > expectedDateForCurrentStage;
    }
  }

  return now > endDate;
}

/**
 * Get project progress percentage based on time elapsed
 */
export function getProjectTimeProgress(
  projectType: ProjectType,
  startDate: Date,
  currentStage?: ProjectStage
): number {
  const stages = getStagesForProjectType(projectType);
  const totalDurationDays = stages.reduce(
    (total, stage) => total + stage.estimatedDurationDays,
    0
  );

  const now = new Date();
  const elapsedDays = Math.floor(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If we have a current stage, use stage-based progress
  if (currentStage) {
    const currentStageIndex = stages.findIndex((s) => s.id === currentStage);
    if (currentStageIndex >= 0) {
      const completedStagesDays = stages
        .slice(0, currentStageIndex)
        .reduce((total, stage) => total + stage.estimatedDurationDays, 0);
      const currentStageProgress = Math.min(
        elapsedDays - completedStagesDays,
        stages[currentStageIndex].estimatedDurationDays
      );
      const totalProgressDays =
        completedStagesDays + Math.max(0, currentStageProgress);

      return Math.min(
        100,
        Math.max(0, Math.round((totalProgressDays / totalDurationDays) * 100))
      );
    }
  }

  // Otherwise use time-based progress
  return Math.min(
    100,
    Math.max(0, Math.round((elapsedDays / totalDurationDays) * 100))
  );
}
