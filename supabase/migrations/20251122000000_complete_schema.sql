-- Complete Schema Migration
-- This file contains the entire database schema from the main branch
-- Includes all tables, types, functions, triggers, RLS policies, and indexes
--
-- Generated: 2025-11-22
-- This is a comprehensive migration that sets up the complete database schema

    'MOMO',
    'BANK'
);

    'LAND_PREPARATION',
    'PLANTING',
    'IRRIGATION',
    'TRANSPLANTING',
    'FERTILIZER_APPLICATION',
    'PEST_MANAGEMENT',
    'FRUITING',
    'HARVESTING',
    'SALES',
    'CROP_MANAGEMENT',
    'GROWTH_MONITORING',
    'PROCESSING_SALES',
    'PAYOUT_CLOSURE',
    'HOUSING_PEN_SETUP',
    'STOCKING_ANIMAL_PURCHASE',
    'FEEDING_HEALTH_MANAGEMENT',
    'GROWTH_MONITORING_LIVESTOCK',
    'PROCESSING_SALES_LIVESTOCK',
    'PAYOUT_CLOSURE_LIVESTOCK',
    'BROODING_SETUP',
    'CHICK_ARRIVAL_ONBOARDING',
    'FEEDING_GROWTH_MONITORING',
    'PRODUCTION_HARVEST_STAGE',
    'SALES_POULTRY',
    'PAYOUT_CLOSURE_POULTRY',
    'POND_TANK_SETUP',
    'FINGERLINGS_STOCKING',
    'FEEDING_WATER_MANAGEMENT',
    'GROWTH_PHASE',
    'HARVESTING_AQUACULTURE',
    'SALES_AQUACULTURE',
    'PAYOUT_CLOSURE_AQUACULTURE'
);

COMMENT ON TYPE "public"."PROJECT_STAGE" IS 'Project stages based on official project timelines document - covers CROP, LIVESTOCK, POULTRY, and AQUACULTURE project types';

    'CROP',
    'LIVESTOCK',
    'POULTRY'
);

COMMENT ON TYPE "public"."PROJECT_TYPES" IS 'PROJECT TYPES';

    'Active',
    'Suspended',
    'Inactive'
);

    'Active',
    'Inactive',
    'Suspended'
);

    'Supper Admin',
    'Farm Admin',
    'Investment Admin',
    'Finance Admin',
    'Support',
    'Regular User',
    'Super Admin',
    'Marketing',
    'IR Admin',
    'Investment Manager'
);

    'Users',
    'Investors',
    'All'
);

COMMENT ON TYPE "public"."audience_type" IS 'notification audience types';

    'momo',
    'bank',
    'card',
    'wallet'
);

COMMENT ON TYPE "public"."channel" IS 'payment channels';

    'completed',
    'pending',
    'failed',
    'verified'
);

    'Investment',
    'System',
    'Marketing',
    'Announcement',
    'Alert'
);

    'Email',
    'SMS',
    'InApp',
    'Push',
    'All'
);

    'Low',
    'Medium',
    'High',
    'Urgent'
);

    'Scheduled',
    'Published',
    'Failed',
    'Draft'
);

    'InApp',
    'Push',
    'Email',
    'All',
    'SMS'
);

COMMENT ON TYPE "public"."notification_type" IS 'type of notifications';

    'Returns',
    'Principal',
    'Bonus',
    'Dividend',
    'Withdrawal'
);

COMMENT ON TYPE "public"."payout_types" IS 'type of payouts';

    'Complete',
    'Pending',
    'Failed'
);

COMMENT ON TYPE "public"."transaction_status" IS 'status of transactions';

    'Payin',
    'Payout',
    'Refund',
    'momo_topup',
    'card_topup',
    'momo_withdrawal',
    'bank_withdrawal',
    'payout_return',
    'investment'
);

COMMENT ON TYPE "public"."transaction_type" IS 'type of transactions';

    'Male',
    'Female',
    'Other'
);

    'Unread',
    'Read',
    'Dismissed'
);

COMMENT ON TYPE "public"."user_notification_status" IS 'status of user notification';

    'USER',
    'COMPANY'
);

COMMENT ON TYPE "public"."wallet_type" IS 'type of wallet ';

