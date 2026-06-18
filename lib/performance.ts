/**
 * Performance monitoring utility for tracking page load times,
 * component render times, and API response times.
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags?: Record<string, string>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();

  startTimer(name: string, tags?: Record<string, string>): { end: () => number } {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      tags,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);

    return {
      end: () => {
        metric.endTime = performance.now();
        metric.duration = metric.endTime - metric.startTime;
        
        if (process.env.NODE_ENV === 'development') {
          console.debug(
            `⏱️ ${name}: ${metric.duration.toFixed(2)}ms`,
            tags ? `(${JSON.stringify(tags)})` : ''
          );
        }
        
        return metric.duration;
      },
    };
  }

  getMetrics(name?: string) {
    if (name) {
      return this.metrics.get(name) || [];
    }
    return Array.from(this.metrics.entries()).reduce((acc, [key, values]) => {
      acc[key] = values;
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);
  }

  getAverageTime(name: string): number {
    const metrics = this.metrics.get(name) || [];
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / metrics.length;
  }

  clear(name?: string) {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

export function usePerformanceTracking(componentName: string) {
  return {
    startTimer: (name?: string) => performanceMonitor.startTimer(name || componentName),
    endTimer: (timer?: ReturnType<typeof performanceMonitor.startTimer>) => {
      if (timer) return timer.end();
      return 0;
    },
    getMetrics: () => performanceMonitor.getMetrics(componentName),
  };
}
