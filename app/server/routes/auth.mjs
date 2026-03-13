import { Router } from 'express';
var router = Router();

router.get('/', async (req, res, next) => {
	res.send({ user: req.session ? req.session.user : null });
});

router.get('/me', async (req, res, next) => {
	res.send({ user: req.session ? req.session.user : null });
});

router.all('/logout', async (req, res, next) => {
	if (req.session) {
		// if (req.session.user?.id)
		// 	disconnectUserById(req.session.user?.id);

		req.session.destroy(err => {
			if (err) {
				console.error('Error destroying session:', err);
				res.status(500).send({ error: 'Failed to log out' });
				return;
			}
		});
	}
	res.send({ type: 'success' });
});

router.post('/joinAsGuest', async (req, res, next) => {
	const name = req?.body?.name;
	// const { name } = req?.body;

	if (!name || typeof name !== 'string' || name.trim() === '') {
		res.status(400).send({ info: 'INVALID_NAME' });
		return;
	}

	// Create a guest user object
	const guestUser = {
		id: `guest_${Date.now()}`,
		username: name.trim(),
		isGuest: true,
	};

	if (req.session) {
		req.session.user = guestUser;
	}

	res.send({ user: req.session ? req.session.user : null });
});

export default (app) => app.use('/auth', router);
