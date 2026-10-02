const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const prisma = require('../prisma');
const { auth } = require('../middleware/auth');

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../../uploads'),
    filename: (_, file, cb) =>
      cb(null, Date.now() + '-' + file.originalname.replace(/[^\w.-]/g, '_')),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Pending', 'In Progress', 'Awaiting Admin Approval', 'Completed', 'Rejected'];
const include = {
  service: { select: { id: true, name: true, icon: true } },
  user: { select: { id: true, name: true, email: true } },
  technician: { select: { id: true, name: true, email: true } },
};
const canTechnicianSee = (user, request) =>
  request.technicianId === user.id ||
  (request.technicianId === null && request.status === 'In Progress' && user.serviceIds.includes(request.serviceId));

router.use(auth);

// Users see their requests, admins see all, and technicians see available or assigned work.
router.get('/', async (req, res) => {
  const where = {};
  if (req.user.role === 'user') where.userId = req.user.id;
  if (req.user.role === 'technician') {
    where.OR = [
      { technicianId: req.user.id },
      { technicianId: null, status: 'In Progress', serviceId: { in: req.user.serviceIds } },
    ];
  }
  if (req.query.status) where.status = req.query.status;
  res.json(await prisma.request.findMany({ where, include, orderBy: { createdAt: 'desc' } }));
});

router.get('/stats', async (req, res) => {
  const where = req.user.role === 'user' ? { userId: req.user.id } :
    req.user.role === 'technician' ? {
      OR: [
        { technicianId: req.user.id },
        { technicianId: null, status: 'In Progress', serviceId: { in: req.user.serviceIds } },
      ],
    } : {};
  const grouped = await prisma.request.groupBy({ by: ['status'], where, _count: true });
  const stats = {
    total: 0, Pending: 0, 'In Progress': 0,
    'Awaiting Admin Approval': 0, Completed: 0, Rejected: 0,
  };
  grouped.forEach((g) => { stats[g.status] = g._count; stats.total += g._count; });
  res.json(stats);
});

router.get('/:id', async (req, res) => {
  const r = await prisma.request.findUnique({
    where: { id: +req.params.id },
    include: { ...include, comments: { include: { user: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } } },
  });
  if (!r) return res.status(404).json({ message: 'Not found' });
  if (req.user.role === 'user' && r.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  if (req.user.role === 'technician' && !canTechnicianSee(req.user, r)) return res.status(403).json({ message: 'Forbidden' });
  res.json(r);
});

router.post('/', (req, res, next) => {
  if (req.user.role !== 'user') return res.status(403).json({ message: 'Only users can create requests' });
  next();
}, upload.single('attachment'), async (req, res) => {
  const { title, description, priority, serviceId } = req.body;
  if (!title || !description || !PRIORITIES.includes(priority) || !serviceId)
    return res.status(400).json({ message: 'title, description, priority and serviceId are required' });
  const service = await prisma.service.findUnique({ where: { id: +serviceId } });
  if (!service || service.status !== 'active') return res.status(400).json({ message: 'Invalid service' });
  const created = await prisma.request.create({
    data: {
      title, description, priority,
      serviceId: +serviceId,
      userId: req.user.id,
      attachment: req.file ? `/uploads/${req.file.filename}` : null,
    },
    include,
  });
  res.status(201).json(created);
});

router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const request = await prisma.request.findUnique({ where: { id: +req.params.id } });
  if (!request) return res.status(404).json({ message: 'Not found' });

  let data;
  if (req.user.role === 'admin') {
    const adminTransitions = {
      Pending: ['In Progress', 'Rejected'],
      'Awaiting Admin Approval': ['Completed', 'In Progress'],
    };
    if (!(adminTransitions[request.status] || []).includes(status))
      return res.status(400).json({ message: 'Invalid admin status transition' });
    data = { status };
  } else if (req.user.role === 'technician') {
    if (status === 'In Progress' && request.status === 'In Progress' && request.technicianId === null && req.user.serviceIds.includes(request.serviceId)) {
      data = { technicianId: req.user.id };
    } else if (status === 'Awaiting Admin Approval' && request.status === 'In Progress' && request.technicianId === req.user.id) {
      data = { status };
    } else {
      return res.status(400).json({ message: 'Invalid technician status transition' });
    }
  } else {
    return res.status(403).json({ message: 'Only staff can change request status' });
  }

  try {
    if (req.user.role === 'technician' && data.technicianId === req.user.id) {
      const claimed = await prisma.request.updateMany({
        where: { id: request.id, status: 'In Progress', technicianId: null, serviceId: { in: req.user.serviceIds } },
        data,
      });
      if (!claimed.count) return res.status(409).json({ message: 'This request was already claimed' });
      return res.json(await prisma.request.findUnique({ where: { id: request.id }, include }));
    }
    res.json(await prisma.request.update({ where: { id: request.id }, data, include }));
  } catch {
    res.status(404).json({ message: 'Not found' });
  }
});

router.post('/:id/comments', async (req, res) => {
  const r = await prisma.request.findUnique({ where: { id: +req.params.id } });
  if (!r) return res.status(404).json({ message: 'Not found' });
  if (req.user.role === 'user' && r.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  if (req.user.role === 'technician' && !canTechnicianSee(req.user, r)) return res.status(403).json({ message: 'Forbidden' });
  if (!req.body.comment) return res.status(400).json({ message: 'Comment is required' });
  const c = await prisma.comment.create({
    data: { comment: req.body.comment, requestId: r.id, userId: req.user.id },
    include: { user: { select: { name: true, role: true } } },
  });
  res.status(201).json(c);
});

module.exports = router;
