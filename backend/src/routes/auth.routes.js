const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { auth } = require('../middleware/auth');

const sign = (u) => jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const safe = ({ password, ...u }) => u;

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ message: 'Name, email and password (6+ chars) are required' });
  if (await prisma.user.findUnique({ where: { email } }))
    return res.status(409).json({ message: 'Email already registered' });
  // role is always "user" on public registration
  const user = await prisma.user.create({
    data: { name, email, password: await bcrypt.hash(password, 10) },
  });
  res.status(201).json({ token: sign(user), user: safe(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email || '' } });
  if (!user || !(await bcrypt.compare(password || '', user.password)))
    return res.status(401).json({ message: 'Invalid email or password' });
  if (user.status === 'blocked') return res.status(403).json({ message: 'Account blocked' });
  res.json({ token: sign(user), user: safe(user) });
});

router.put('/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof newPassword !== 'string' || newPassword.length < 8)
    return res.status(400).json({ message: 'New password must be at least 8 characters' });
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user || !(await bcrypt.compare(currentPassword || '', user.password)))
    return res.status(400).json({ message: 'Current password is incorrect' });
  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(newPassword, 10) },
  });
  res.json({ message: 'Password updated' });
});

router.get('/me', auth, async (req, res) => {
  res.json(safe(await prisma.user.findUnique({ where: { id: req.user.id } })));
});

module.exports = router;
