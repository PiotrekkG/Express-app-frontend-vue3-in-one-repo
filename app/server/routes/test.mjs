import { Router } from 'express';
var router = Router();

router.use((req, res, next) => {
	console.log('Test route accessed');
	//not logged
	if (!req.session?.user) {
		// res.redirect('/login');
		res.status(401).send({ info: 'NOTLOGGED' });
		return;
	}

	next();
});

router.use((req, res, next) => {
	console.log('Test route - permissions check');
	//not permitted
	if (!req.session?.user?.permissions) {
		// res.redirect('/');
		res.status(403).send({ info: 'FORBIDDEN' });
		return;
	}

	next();
});

router.get('/', async (req, res, next) => {
	res.send({ user: req.session ? req.session.user : null });
});

router.get('/user/:id', async (req, res, next) => {
	var id = req.params.id;

	if (id === undefined || isNaN(id)) {
		res.redirect('/admin');
		return;
	}

	var userData = await getUser('id', id);

	if (userData) {
		var currUserId = req.session?.user?.id;
		if (currUserId != userData.id) {
			userData.inFav = !userData.inFavPlayers.some(player => player.id == currUserId);
		} else {
			userData.isItMe = true;
		}
	}

	res.render('admin/user', {
		user: req.session ? req.session.user : null,
		userData: userData,
		page: {
			title: 'Panel Administracyjny',
			submenu: {
			},
			scripts: [
				'base',
				'admin'
			]
		}
	});
});

router.post('/getPlayerRegions', async (req, res, next) => {
	var playerId = req.body.id;

	if (playerId == undefined || isNaN(playerId)) {
		res.json({ type: 'error', value: 'userError' });
		return;
	}

	var currUserId = req.session?.user?.id;
	var currSessionId = req.session?.user?.sessionId;

	var response = await getUserRegions(playerId, days);

	if (response)
		res.json({ type: 'success', data: response });
	else
		res.json({ type: 'error' });
});

export default (app) => {
	console.log('Initializing test route');
	app.use('/test', router);
}
