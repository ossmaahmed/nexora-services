const router = require('express').Router();
const prisma = require('../prisma');
const { auth, isAdmin } = require('../middleware/auth');

const select = {
  id: true, name: true, email: true, role: true, status: true, createdAt: true,
  serviceSkills: { select: { id: true, name: true, icon: true } },
};
router.use(auth, isAdmin);

router.get('/', async (req, res) => {
  const q = req.query.search || '';
  res.json(await prisma.user.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {},
    select, orderBy: { createdAt: 'desc' },
  }));
});

router.get('/stats', async (req, res) => {
  const [total, users, technicians, admins] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'user' } }),
    prisma.user.count({ where: { role: 'technician' } }),
    prisma.user.count({ where: { role: 'admin' } }),
  ]);
  res.json({ total, users, technicians, admins });
});

router.put('/:id/block', async (req, res) => {
  const id = +req.params.id;
  if (id === req.user.id) return res.status(400).json({ message: "You can't block yourself" });
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return res.status(404).json({ message: 'Not found' });
  res.json(await prisma.user.update({
    where: { id }, data: { status: u.status === 'blocked' ? 'active' : 'blocked' }, select,
  }));
});

router.put('/:id/role', async (req, res) => {
  const id = +req.params.id;
  if (!['user', 'admin', 'technician'].includes(req.body.role)) return res.status(400).json({ message: 'Invalid role' });
  if (id === req.user.id) return res.status(400).json({ message: "You can't change your own role" });
  try {
    res.json(await prisma.user.update({
      where: { id },
      data: {
        role: req.body.role,
        ...(req.body.role !== 'technician' ? { serviceSkills: { set: [] } } : {}),
      },
      select,
    }));
  } catch { res.status(404).json({ message: 'Not found' }); }
});

router.put('/:id/services', async (req, res) => {
  const id = +req.params.id;
  const { serviceIds } = req.body;
  if (!Array.isArray(serviceIds) || serviceIds.some((serviceId) => !Number.isInteger(serviceId) || serviceId < 1))
    return res.status(400).json({ message: 'serviceIds must be an array of positive integers' });
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!user) return res.status(404).json({ message: 'Not found' });
  if (user.role !== 'technician') return res.status(400).json({ message: 'Only technicians can be assigned services' });
  const uniqueIds = [...new Set(serviceIds)];
  const activeCount = await prisma.service.count({ where: { id: { in: uniqueIds }, status: 'active' } });
  if (activeCount !== uniqueIds.length) return res.status(400).json({ message: 'One or more services are invalid or inactive' });
  res.json(await prisma.user.update({
    where: { id },
    data: { serviceSkills: { set: uniqueIds.map((serviceId) => ({ id: serviceId })) } },
    select,
  }));
});

module.exports = router;
