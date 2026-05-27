"use client";

import React, { Component, useEffect, useRef } from "react";

// Performance monitoring utilities
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number;
  endpoint?: string;
  maxMetrics: number;
}

const defaultConfig: PerformanceConfig = {
  enabled: process.env.NODE_ENV === 'production',
  sampleRate: 0.1, // 10% of users
  endpoint: '/api/performance',
  maxMetrics: 100,
};

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private config: PerformanceConfig;
  private isSampled: boolean;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.isSampled = Math.random() < this.config.sampleRate;
  }

  // Track a performance metric
  track(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    if (!this.config.enabled || !this.isSampled) return;

    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metrics.push(fullMetric);

    // Keep only the latest metrics
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics = this.metrics.slice(-this.config.maxMetrics);
    }

    // Batch send metrics every 30 seconds
    if (this.metrics.length >= 10) {
      this.flush();
    }
  }

  // Track page load performance
  trackPageLoad(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    this.track({
      name: 'page_load',
      value: navigation.loadEventEnd - navigation.startTime,
      unit: 'ms',
      tags: { path: window.location.pathname },
    });

    // Track individual metrics
    const metrics = {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      ssl: navigation.connectEnd - navigation.secureConnectionStart,
      ttfb: navigation.responseStart - navigation.requestStart,
      download: navigation.responseEnd - navigation.responseStart,
      dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      load: navigation.loadEventEnd - navigation.loadEventStart,
    };

    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        this.track({
          name: `page_load_${name}`,
          value,
          unit: 'ms',
          tags: { path: window.location.pathname },
        });
      }
    });
  }

  // Track component render time
  trackComponentRender(componentName: string, renderTime: number): void {
    this.track({
      name: 'component_render',
      value: renderTime,
      unit: 'ms',
      tags: { component: componentName },
    });
  }

  // Track API request performance
  trackApiRequest(
    endpoint: string,
    duration: number,
    status: number,
    method: string = 'GET'
  ): void {
    this.track({
      name: 'api_request',
      value: duration,
      unit: 'ms',
      tags: { endpoint, status: status.toString(), method },
    });
  }

  // Track Web Vitals
  trackWebVital(metric: any): void {
    this.track({
      name: metric.name,
      value: metric.value,
      unit: 'ms',
      tags: {
        id: metric.id,
        rating: metric.rating,
        navigationType: metric.navigationType,
      },
    });
  }

  // Flush metrics to server
  async flush(): Promise<void> {
    if (this.metrics.length === 0 || !this.config.endpoint) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: metricsToSend }),
        keepalive: true, // Send even if page is unloading
      });
    } catch (error) {
      // Silently fail - don't affect user experience
      console.warn('Failed to send performance metrics:', error);
    }
  }

  // Get current metrics (for debugging)
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Clear metrics
  clear(): void {
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for tracking component performance
export function usePerformanceTracking(componentName: string) {
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTimeRef.current;
      
      performanceMonitor.trackComponentRender(componentName, renderTime);
    };
  }, [componentName]);

  return {
    startTimer: () => {
      startTimeRef.current = performance.now();
    },
    endTimer: () => {
      const endTime = performance.now();
      const renderTime = endTime - startTimeRef.current;
      performanceMonitor.trackComponentRender(componentName, renderTime);
      return renderTime;
    },
  };
}

// Higher-order component for performance tracking
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    usePerformanceTracking(componentName);
    return React.createElement(Component, props);
  };
  
  // Copy display name for debugging
  WrappedComponent.displayName = `withPerformanceTracking(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Track page load on initial load
  if (document.readyState === 'complete') {
    setTimeout(() => performanceMonitor.trackPageLoad(), 0);
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => performanceMonitor.trackPageLoad(), 0);
    });
  }

  // Flush metrics before page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.flush();
  });

  // Flush metrics periodically
  setInterval(() => performanceMonitor.flush(), 30000);
}