const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { serviceSkills: { select: { id: true } } },
    });
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.status === 'blocked') return res.status(403).json({ message: 'Account blocked' });
    req.user = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      serviceIds: user.serviceSkills.map((service) => service.id),
    };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Forbidden' });

module.exports = { auth, isAdmin: requireRole('admin'), isStaff: requireRole('admin', 'technician') };
