require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const hash = (p) => bcrypt.hashSync(p, 10);

const SERVICE_SEED = [
  { name: 'Cloud Deployment', description: 'Deploy and manage apps on AWS, Azure or GCP', icon: '☁️' },
  { name: 'Kubernetes', description: 'Cluster setup, scaling and troubleshooting', icon: '☸️' },
  { name: 'Database Management', description: 'Backups, tuning and migrations', icon: '🗄️' },
  { name: 'CI/CD Pipelines', description: 'Automated build, test and release flows', icon: '🔁' },
  { name: 'Security & Access', description: 'Permissions, audits and hardening', icon: '🔒' },
  { name: 'Monitoring', description: 'Dashboards, alerts and logging', icon: '📈' },
];

const REQUEST_SEED = [
  {
    title: 'Production cluster autoscaling review',
    description: 'We need an audit of node autoscaling thresholds before the next traffic surge. Please validate workloads and current limits.',
    priority: 'High',
    status: 'In Progress',
    userEmail: 'user@nexora.io',
    serviceName: 'Kubernetes',
  },
  {
    title: 'Database backup retention policy',
    description: 'Our team needs a backup retention plan for customer data with safe restore verification as part of compliance.',
    priority: 'Critical',
    status: 'Pending',
    userEmail: 'user@nexora.io',
    serviceName: 'Database Management',
  },
  {
    title: 'CI pipeline for mobile release branch',
    description: 'The release branch is missing automated lint and smoke tests. Please prepare a deploy pipeline for staging validation.',
    priority: 'Medium',
    status: 'Completed',
    userEmail: 'user@nexora.io',
    serviceName: 'CI/CD Pipelines',
  },
  {
    title: 'IAM access cleanup for contractors',
    description: 'Several temporary contractor accounts have outdated permissions. Please review and reduce access to only required resources.',
    priority: 'High',
    status: 'Rejected',
    userEmail: 'user@nexora.io',
    serviceName: 'Security & Access',
  },
  {
    title: 'Deploy new API environment on AWS',
    description: 'We need a new staging environment for the API stack with networking, backups and health check monitoring configured.',
    priority: 'High',
    status: 'Pending',
    userEmail: 'user@nexora.io',
    serviceName: 'Cloud Deployment',
  },
  {
    title: 'Alert tuning for service latency',
    description: 'The current latency alerts are too noisy. Please define better warnings for API tail latency and dependency failures.',
    priority: 'Low',
    status: 'Completed',
    userEmail: 'user@nexora.io',
    serviceName: 'Monitoring',
  },
];

const COMMENT_SEED = [
  {
    requestTitle: 'Production cluster autoscaling review',
    userEmail: 'tech@nexora.io',
    comment: 'We identified three under-provisioned node groups and are validating workload quotas before rollout.',
  },
  {
    requestTitle: 'Database backup retention policy',
    userEmail: 'admin@nexora.io',
    comment: 'We have the retention windows mapped to the compliance checklist and are awaiting final approval.',
  },
  {
    requestTitle: 'CI pipeline for mobile release branch',
    userEmail: 'tech@nexora.io',
    comment: 'The build pipeline is now enabled for staging and the smoke test suite is passing on the release branch.',
  },
  {
    requestTitle: 'Alert tuning for service latency',
    userEmail: 'admin@nexora.io',
    comment: 'Alert thresholds were adjusted based on the last 30 days of incidents and the team confirmed the new baseline.',
  },
];

async function main() {
  const userSeed = [
    { name: 'Admin', email: 'admin@nexora.io', password: hash('Admin@123'), role: 'admin' },
    { name: 'Technician', email: 'tech@nexora.io', password: hash('Tech@123'), role: 'technician' },
    { name: 'Demo User', email: 'user@nexora.io', password: hash('User@123'), role: 'user' },
  ];

  for (const user of userSeed) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  if ((await prisma.service.count()) === 0) {
    await prisma.service.createMany({ data: SERVICE_SEED });
  }

  const userMap = Object.fromEntries(
    (await prisma.user.findMany({ select: { email: true, id: true } })).map((user) => [user.email, user.id]),
  );
  const serviceMap = Object.fromEntries(
    (await prisma.service.findMany({ select: { name: true, id: true } })).map((service) => [service.name, service.id]),
  );

  if ((await prisma.request.count()) === 0) {
    const createdRequests = [];

    for (const request of REQUEST_SEED) {
      const record = await prisma.request.create({
        data: {
          title: request.title,
          description: request.description,
          priority: request.priority,
          status: request.status,
          userId: userMap[request.userEmail],
          serviceId: serviceMap[request.serviceName],
        },
      });
      createdRequests.push(record);
    }

    for (const comment of COMMENT_SEED) {
      const request = createdRequests.find((item) => item.title === comment.requestTitle);
      if (!request) continue;

      await prisma.comment.create({
        data: {
          comment: comment.comment,
          requestId: request.id,
          userId: userMap[comment.userEmail],
        },
      });
    }
  }

  console.log('Seed done. admin@nexora.io / Admin@123');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
