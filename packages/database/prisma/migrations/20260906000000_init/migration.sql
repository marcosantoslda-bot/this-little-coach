-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'COACH', 'ADMIN');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('FEMALE', 'MALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "FitnessGoal" AS ENUM ('LOSE_FAT', 'GAIN_MUSCLE', 'MAINTAIN', 'IMPROVE_ENDURANCE', 'GENERAL_HEALTH');

-- CreateEnum
CREATE TYPE "FitnessLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ATHLETE');

-- CreateEnum
CREATE TYPE "TrainingFocus" AS ENUM ('BALANCED', 'LOWER_BODY_GLUTES', 'UPPER_BODY_ARMS', 'CORE', 'CARDIO');

-- CreateEnum
CREATE TYPE "TrainingLocation" AS ENUM ('HOME', 'GYM', 'OUTDOOR', 'ANYWHERE');

-- CreateEnum
CREATE TYPE "TrainingMode" AS ENUM ('NORMAL', 'VACATION', 'PAUSED', 'SICK', 'RECOVERING');

-- CreateEnum
CREATE TYPE "Equipment" AS ENUM ('NONE', 'MAT', 'PULL_UP_BAR', 'RESISTANCE_BAND', 'DUMBBELLS', 'KETTLEBELL', 'BARBELL', 'BENCH', 'CABLE_MACHINE', 'MACHINE', 'JUMP_ROPE', 'PLYO_BOX', 'TREADMILL', 'BIKE', 'ROWER');

-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'LATS', 'UPPER_BACK', 'LOWER_BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'CORE', 'OBLIQUES', 'GLUTES', 'QUADS', 'HAMSTRINGS', 'CALVES', 'HIP_FLEXORS', 'ADDUCTORS', 'ABDUCTORS', 'FULL_BODY', 'CARDIOVASCULAR');

-- CreateEnum
CREATE TYPE "MovementPattern" AS ENUM ('PUSH_HORIZONTAL', 'PUSH_VERTICAL', 'PULL_HORIZONTAL', 'PULL_VERTICAL', 'SQUAT', 'HINGE', 'LUNGE', 'CARRY', 'ROTATION', 'ANTI_ROTATION', 'LOCOMOTION', 'JUMP', 'ISOMETRIC');

-- CreateEnum
CREATE TYPE "ExerciseCategory" AS ENUM ('STRENGTH', 'CARDIO', 'PLYOMETRIC', 'MOBILITY', 'STRETCH', 'CORE');

-- CreateEnum
CREATE TYPE "ExerciseMetric" AS ENUM ('REPS', 'DURATION', 'DISTANCE', 'CALORIES');

-- CreateEnum
CREATE TYPE "WorkoutFocus" AS ENUM ('FULL_BODY', 'UPPER_BODY', 'LOWER_BODY', 'PUSH', 'PULL', 'LEGS', 'CORE', 'CARDIO', 'MOBILITY');

-- CreateEnum
CREATE TYPE "WorkoutFormat" AS ENUM ('STRAIGHT_SETS', 'SUPERSET', 'CIRCUIT', 'AMRAP', 'EMOM', 'FOR_TIME', 'TABATA', 'INTERVAL');

-- CreateEnum
CREATE TYPE "WorkoutSource" AS ENUM ('SYSTEM', 'GENERATED', 'USER');

-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('WARMUP', 'MAIN', 'FINISHER', 'COOLDOWN');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "SessionSource" AS ENUM ('APP', 'MANUAL', 'IMPORTED');

-- CreateEnum
CREATE TYPE "SetAdjustmentReason" AS ENUM ('NONE', 'TOO_HARD', 'TOO_EASY', 'PAIN', 'OUT_OF_TIME', 'EQUIPMENT_MISSING', 'OTHER');

-- CreateEnum
CREATE TYPE "RecordMetric" AS ENUM ('MAX_REPS', 'MAX_DURATION_SEC', 'MAX_LOAD_KG', 'FASTEST_TIME_SEC', 'MAX_DISTANCE_M');

-- CreateEnum
CREATE TYPE "MeasurementSource" AS ENUM ('MANUAL', 'IMPORTED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "auth_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'pt-PT',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Lisbon',
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "sex" "Sex",
    "birth_date" DATE,
    "height_cm" INTEGER,
    "starting_weight_kg" DECIMAL(5,2),
    "target_weight_kg" DECIMAL(5,2),
    "body_fat_pct" DECIMAL(4,1),
    "goal" "FitnessGoal" NOT NULL DEFAULT 'GENERAL_HEALTH',
    "fitness_level" "FitnessLevel" NOT NULL DEFAULT 'BEGINNER',
    "focus" "TrainingFocus" NOT NULL DEFAULT 'BALANCED',
    "training_days_per_week" INTEGER NOT NULL DEFAULT 3,
    "preferred_session_minutes" INTEGER NOT NULL DEFAULT 30,
    "preferred_location" "TrainingLocation" NOT NULL DEFAULT 'HOME',
    "available_equipment" "Equipment"[] DEFAULT ARRAY['NONE']::"Equipment"[],
    "active_mode" "TrainingMode" NOT NULL DEFAULT 'NORMAL',
    "restricted_muscles" "MuscleGroup"[] DEFAULT ARRAY[]::"MuscleGroup"[],
    "limitations_note" TEXT,
    "onboarding_completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ExerciseCategory" NOT NULL,
    "movement_pattern" "MovementPattern" NOT NULL,
    "primary_muscles" "MuscleGroup"[],
    "secondary_muscles" "MuscleGroup"[] DEFAULT ARRAY[]::"MuscleGroup"[],
    "equipment" "Equipment"[] DEFAULT ARRAY['NONE']::"Equipment"[],
    "difficulty" INTEGER NOT NULL DEFAULT 2,
    "metric" "ExerciseMetric" NOT NULL DEFAULT 'REPS',
    "is_unilateral" BOOLEAN NOT NULL DEFAULT false,
    "met_value" DECIMAL(4,1),
    "default_tempo" TEXT,
    "thumbnail_url" TEXT,
    "video_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_translations" (
    "id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cues" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "exercise_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_progressions" (
    "id" UUID NOT NULL,
    "easier_id" UUID NOT NULL,
    "harder_id" UUID NOT NULL,
    "criteria" TEXT,

    CONSTRAINT "exercise_progressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workouts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "focus" "WorkoutFocus" NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 2,
    "estimated_duration_min" INTEGER NOT NULL,
    "required_equipment" "Equipment"[] DEFAULT ARRAY['NONE']::"Equipment"[],
    "source" "WorkoutSource" NOT NULL DEFAULT 'SYSTEM',
    "created_by_id" UUID,
    "generation_input" JSONB,
    "generator_version" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_blocks" (
    "id" UUID NOT NULL,
    "workout_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "BlockType" NOT NULL DEFAULT 'MAIN',
    "format" "WorkoutFormat" NOT NULL DEFAULT 'STRAIGHT_SETS',
    "name" TEXT,
    "rounds" INTEGER NOT NULL DEFAULT 1,
    "time_cap_sec" INTEGER,
    "rest_between_exercises_sec" INTEGER NOT NULL DEFAULT 0,
    "rest_between_rounds_sec" INTEGER NOT NULL DEFAULT 60,
    "notes" TEXT,

    CONSTRAINT "workout_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_exercises" (
    "id" UUID NOT NULL,
    "block_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "target_reps" INTEGER,
    "target_duration_sec" INTEGER,
    "target_distance_m" INTEGER,
    "target_load_kg" DECIMAL(6,2),
    "rest_after_sec" INTEGER,
    "tempo" TEXT,
    "notes" TEXT,

    CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "workout_id" UUID,
    "workout_snapshot" JSONB NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "source" "SessionSource" NOT NULL DEFAULT 'APP',
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "duration_sec" INTEGER,
    "energy_before" INTEGER,
    "rpe" INTEGER,
    "mood_after" INTEGER,
    "rating" INTEGER,
    "notes" TEXT,
    "estimated_calories" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_sets" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "workout_exercise_id" UUID,
    "block_order" INTEGER NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,
    "target_reps" INTEGER,
    "target_duration_sec" INTEGER,
    "reps_completed" INTEGER,
    "duration_sec" INTEGER,
    "distance_m" INTEGER,
    "load_kg" DECIMAL(6,2),
    "rpe" INTEGER,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "adjustment_reason" "SetAdjustmentReason" NOT NULL DEFAULT 'NONE',
    "substituted_from_id" UUID,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "metric" "RecordMetric" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "session_id" UUID,
    "achieved_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_measurements" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "measured_at" DATE NOT NULL,
    "source" "MeasurementSource" NOT NULL DEFAULT 'MANUAL',
    "weight_kg" DECIMAL(5,2),
    "body_fat_pct" DECIMAL(4,1),
    "waist_cm" DECIMAL(5,1),
    "hip_cm" DECIMAL(5,1),
    "chest_cm" DECIMAL(5,1),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_id_key" ON "users"("auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_slug_key" ON "exercises"("slug");

-- CreateIndex
CREATE INDEX "exercises_category_idx" ON "exercises"("category");

-- CreateIndex
CREATE INDEX "exercises_movement_pattern_idx" ON "exercises"("movement_pattern");

-- CreateIndex
CREATE INDEX "exercises_difficulty_idx" ON "exercises"("difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_translations_exercise_id_locale_key" ON "exercise_translations"("exercise_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_progressions_easier_id_harder_id_key" ON "exercise_progressions"("easier_id", "harder_id");

-- CreateIndex
CREATE INDEX "workouts_source_is_published_idx" ON "workouts"("source", "is_published");

-- CreateIndex
CREATE INDEX "workouts_created_by_id_idx" ON "workouts"("created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "workout_blocks_workout_id_order_key" ON "workout_blocks"("workout_id", "order");

-- CreateIndex
CREATE INDEX "workout_exercises_exercise_id_idx" ON "workout_exercises"("exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "workout_exercises_block_id_order_key" ON "workout_exercises"("block_id", "order");

-- CreateIndex
CREATE INDEX "workout_sessions_user_id_started_at_idx" ON "workout_sessions"("user_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "workout_sessions_workout_id_idx" ON "workout_sessions"("workout_id");

-- CreateIndex
CREATE INDEX "session_sets_session_id_block_order_round_order_idx" ON "session_sets"("session_id", "block_order", "round", "order");

-- CreateIndex
CREATE INDEX "session_sets_exercise_id_completed_at_idx" ON "session_sets"("exercise_id", "completed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "personal_records_user_id_exercise_id_metric_key" ON "personal_records"("user_id", "exercise_id", "metric");

-- CreateIndex
CREATE INDEX "body_measurements_user_id_measured_at_idx" ON "body_measurements"("user_id", "measured_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "body_measurements_user_id_measured_at_source_key" ON "body_measurements"("user_id", "measured_at", "source");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_translations" ADD CONSTRAINT "exercise_translations_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_progressions" ADD CONSTRAINT "exercise_progressions_easier_id_fkey" FOREIGN KEY ("easier_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_progressions" ADD CONSTRAINT "exercise_progressions_harder_id_fkey" FOREIGN KEY ("harder_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_blocks" ADD CONSTRAINT "workout_blocks_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "workout_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_sets" ADD CONSTRAINT "session_sets_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_sets" ADD CONSTRAINT "session_sets_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_sets" ADD CONSTRAINT "session_sets_workout_exercise_id_fkey" FOREIGN KEY ("workout_exercise_id") REFERENCES "workout_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "workout_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

