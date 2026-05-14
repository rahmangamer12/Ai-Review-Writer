import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { longcatAI } from '@/lib/longcatAI';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: { status: 'up' | 'down'; responseTime?: number; error?: string };
    aiService: { status: 'up' | 'down'; responseTime?: number; error?: string };
    memory: { status: 'ok' | 'warning'; usage: number; total: number };
  };
}

/**
 * GET /api/health
 * Real health check endpoint - checks actual service status
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const healthCheck: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: { status: 'down' },
      aiService: { status: 'down' },
      memory: { status: 'ok', usage: 0, total: 0 },
    },
  };

  // ── 1. Database Check ─────────────────────────────────────────────────────
  try {
    const dbStart = Date.now();
    await prisma.user.count(); // Simple query to check DB connection
    healthCheck.checks.database = {
      status: 'up',
      responseTime: Date.now() - dbStart,
    };
  } catch (error) {
    healthCheck.checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Database connection failed',
    };
    healthCheck.status = 'degraded';
  }

  // ── 2. AI Service Check ───────────────────────────────────────────────────
  try {
    const aiStart = Date.now();
    if (longcatAI.hasApiKey()) {
      // Lightweight check - just verify API key is configured
      // For a deeper check, we could make a simple API call
      healthCheck.checks.aiService = {
        status: 'up',
        responseTime: Date.now() - aiStart,
      };
    } else {
      healthCheck.checks.aiService = {
        status: 'down',
        error: 'AI API key not configured',
      };
    }
  } catch (error) {
    healthCheck.checks.aiService = {
      status: 'down',
      error: error instanceof Error ? error.message : 'AI service check failed',
    };
  }

  // ── 3. Memory Check ───────────────────────────────────────────────────────
  try {
    const memUsage = process.memoryUsage();
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

    healthCheck.checks.memory = {
      status: usedMB > 400 ? 'warning' : 'ok', // Warning if > 400MB
      usage: usedMB,
      total: totalMB,
    };

    if (usedMB > 400) {
      healthCheck.status = 'degraded';
    }
  } catch {
    // Memory check failed - non-critical
  }

  // ── 4. Overall Status ─────────────────────────────────────────────────────
  // If both critical services are down, mark as unhealthy
  if (
    healthCheck.checks.database.status === 'down' &&
    healthCheck.checks.aiService.status === 'down'
  ) {
    healthCheck.status = 'unhealthy';
  }

  // Return appropriate status code
  const statusCode =
    healthCheck.status === 'healthy' ? 200 : healthCheck.status === 'degraded' ? 200 : 503;

  return NextResponse.json(healthCheck, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Response-Time': `${Date.now() - startTime}ms`,
    },
  });
}
