import { AsyncJobStatus, VerificationResponse } from '../types';

export class ForensicJobQueue {
  private jobs: Map<string, AsyncJobStatus> = new Map();
  private maxConcurrency: number = 4;
  private activeWorkers: number = 0;
  private queue: string[] = [];

  constructor() {
    // Background worker loop
    setInterval(() => this.processNext(), 100);
  }

  public submitJob(
    filename: string,
    executor: (progressCb: (p: number) => void) => Promise<VerificationResponse>
  ): AsyncJobStatus {
    const jobId = `JOB-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    
    const job: AsyncJobStatus = {
      jobId,
      filename,
      status: 'QUEUED',
      progress: 0,
      createdAt: Date.now()
    };

    this.jobs.set(jobId, job);
    this.queue.push(jobId);

    // Attach runner
    (job as any)._executor = executor;

    return job;
  }

  private async processNext(): Promise<void> {
    if (this.activeWorkers >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const jobId = this.queue.shift();
    if (!jobId) return;

    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'QUEUED') return;

    this.activeWorkers++;
    job.status = 'PROCESSING';
    job.progress = 10;
    const start = Date.now();

    const executor = (job as any)._executor;

    // Use microtask scheduling (setImmediate) to guarantee event loop non-blocking
    setImmediate(async () => {
      try {
        job.progress = 35;
        const result = await executor((p: number) => {
          job.progress = Math.min(95, Math.max(job.progress, p));
        });

        job.status = 'COMPLETED';
        job.progress = 100;
        job.completedAt = Date.now();
        job.executionTimeMs = Date.now() - start;
        job.result = result;
      } catch (err: any) {
        job.status = 'FAILED';
        job.progress = 100;
        job.completedAt = Date.now();
        job.executionTimeMs = Date.now() - start;
        job.error = err?.message || 'Forensic execution failed';
      } finally {
        this.activeWorkers--;
        delete (job as any)._executor;
      }
    });
  }

  public getJob(jobId: string): AsyncJobStatus | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    const { ...safeJob } = job;
    delete (safeJob as any)._executor;
    return safeJob;
  }

  public listJobs(limit: number = 20): AsyncJobStatus[] {
    return Array.from(this.jobs.values())
      .slice(-limit)
      .reverse()
      .map(j => {
        const { ...safe } = j;
        delete (safe as any)._executor;
        return safe;
      });
  }

  public getQueueStats(): { activeWorkers: number; queuedCount: number; maxConcurrency: number; totalCompleted: number } {
    const all = Array.from(this.jobs.values());
    const totalCompleted = all.filter(j => j.status === 'COMPLETED').length;
    return {
      activeWorkers: this.activeWorkers,
      queuedCount: this.queue.length,
      maxConcurrency: this.maxConcurrency,
      totalCompleted
    };
  }
}

export const jobQueue = new ForensicJobQueue();
