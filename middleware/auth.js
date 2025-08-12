const TOKEN = 'my-personal-token-abc'; // token tĩnh cho dự án cá nhân

function requireAuth(req, res, next) {
    const auth = req.headers.authorization || '';
    if (auth === `Bearer ${TOKEN}`) return next();
    return res.status(401).json({ success: false, message: 'Unauthorized' });
}

module.exports = { requireAuth, TOKEN };