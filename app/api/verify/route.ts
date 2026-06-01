import { NextRequest } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-verify';

export const POST = verifyAdminRequest;