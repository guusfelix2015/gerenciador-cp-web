-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
