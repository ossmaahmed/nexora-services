const router = require('express').Router();
const prisma = require('../prisma');
const { auth, isAdmin } = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  const where = req.user.role === 'admin' ? {} : { status: 'active' };
  res.json(await prisma.service.findMany({ where }));
});

router.post('/', isAdmin, async (req, res) => {
  const { name, description, icon, status } = req.body;
  if (!name || !description || !icon) return res.status(400).json({ message: 'name, description, icon required' });
  res.status(201).json(await prisma.service.create({ data: { name, description, icon, status } }));
});

router.put('/:id', isAdmin, async (req, res) => {
  const { name, description, icon, status } = req.body;
  try {
    res.json(await prisma.service.update({ where: { id: +req.params.id }, data: { name, description, icon, status } }));
  } catch { res.status(404).json({ message: 'Not found' }); }
});

router.delete('/:id', isAdmin, async (req, res) => {
  try {
    await prisma.service.delete({ where: { id: +req.params.id } });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(409).json({ message: 'Cannot delete a service that has requests; set it to inactive instead' });
  }
});

module.exports = router;
