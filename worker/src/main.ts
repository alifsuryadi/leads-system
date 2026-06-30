import { Worker, Job, UnrecoverableError } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

async function processLeadJob(job: Job): Promise<void> {
  const { id, email, name, campaignId } = job.data;

  console.log(`[Worker] Lead received: ${email}`);
  console.log(`[Worker] → ID: ${id}, Name: ${name}, Campaign: ${campaignId}`);

  // Simulate processing (e.g., sending welcome email, CRM sync)
  // In a real app, failures here would trigger automatic retries
}

const worker = new Worker('leads', processLeadJob, {
  connection,
  concurrency: 5,
});

worker.on('completed', (job: Job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job: Job | undefined, err: Error) => {
  const attempt = job?.attemptsMade ?? 0;
  const maxAttempts = job?.opts?.attempts ?? 3;

  if (attempt >= maxAttempts) {
    console.error(`[Worker] Job ${job?.id} failed permanently after ${attempt} attempt(s): ${err.message}`);
  } else {
    console.warn(`[Worker] Job ${job?.id} failed (attempt ${attempt}/${maxAttempts}), will retry: ${err.message}`);
  }
});

worker.on('error', (err: Error) => {
  console.error('[Worker] Connection error:', err.message);
});

process.on('SIGTERM', async () => {
  console.log('[Worker] Shutting down...');
  await worker.close();
  process.exit(0);
});

console.log('[Worker] Started — listening on "leads" queue...');
