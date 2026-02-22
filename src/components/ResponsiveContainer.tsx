'use client'

import { ReactNode } from 'react';
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
  fullHeight?: boolean;
  fullWidth?: boolean;
}

export default function ResponsiveContainer({
  children,
  className = '',
  mobileClassName = '',
  tabletClassName = '',
  desktopClassName = '',
  fullHeight = false,
  fullWidth = false,
}: ResponsiveContainerProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  let appliedClassName = className;

  if (isMobile) {
    appliedClassName += ` ${mobileClassName}`;
  } else if (isTablet) {
    appliedClassName += ` ${tabletClassName}`;
  } else if (isDesktop) {
    appliedClassName += ` ${desktopClassName}`;
  }

  if (fullHeight) {
    appliedClassName += ' min-h-screen';
  }

  if (fullWidth) {
    appliedClassName += ' w-full';
  }

  return (
    <div className={appliedClassName}>
      {children}
    </div>
  );
}