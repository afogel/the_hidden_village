
/* global require */
/* global particles */
/* global notifications */
/* global messages */

const { $_, $_ready, Space, Platform, Preload } = Artemis;

const Storage = new Space ();

class Monogatari {


	static string (key) {
		return Monogatari._translations[Monogatari.preference ('Language')][key];
	}

	static registerAction (action) {
		Monogatari._actions.push (action);
	}

	static unregisterAction (action) {
		Monogatari._actions = Monogatari._actions.filter ((a) => !(a instanceof action));
	}

	static registerComponent (component) {
		Monogatari._components.push (component);
	}

	static unregisterComponent (component) {
		Monogatari._components = Monogatari._actions.filter ((c) => !(c instanceof component));
	}

	static actions (id, settings = null) {
		if (settings !== null) {
			Monogatari._actions.find ((a) => a.id === id).settings = Object.assign ({}, Monogatari._actions.find ((a) => a.id === id).settings, settings);
		} else {
			return Monogatari._actions.find ((a) => a.id === id);
		}
	}

	static assets (type = null, object = null) {
		if (type !== null && object !== null) {
			if (typeof Monogatari._assets[type] !== 'undefined') {
				Monogatari._assets[type] = Object.assign ({}, Monogatari._assets[type], object);
			} else {
				Monogatari._assets[type] = object;
			}
		} else if (type !== null) {
			if (typeof type === 'string') {
				return Monogatari._assets[type];
			} else if (typeof type === 'object') {
				Monogatari._assets = Object.assign ({}, Monogatari._assets, object);
			}
		} else {
			return Monogatari._assets;
		}
	}

	static asset (type, name, value = null) {
		if (typeof Monogatari._assets[type] !== 'undefined') {
			if (value !== null) {
				Monogatari._assets[type][name] = value;
			} else {
				return Monogatari._assets[type][name];
			}
		} else {
			console.error (`Tried to interact with a non-existing asset type ${type}.`);
		}
	}

	static characters (object = null) {
		if (object !== null) {
			Monogatari._characters = Object.assign ({}, Monogatari._characters, object);
		} else {
			return Monogatari._characters;
		}
	}

	static character (id, object = null) {
		if (object !== null) {
			if (typeof Monogatari._characters[id] !== 'undefined') {
				Monogatari._characters[id] = Object.assign ({}, Monogatari._characters[id], object);
			} else {
				Monogatari._characters[id] = object;
			}
		} else {
			return Monogatari._characters[id];
		}
	}

	static translation (language, strings) {
		if (typeof Monogatari._translations[language] !== 'undefined') {
			Monogatari._translations[language] = Object.assign ({}, Monogatari._translations[language], strings);
		} else {
			Monogatari._translations[language] = strings;
		}
	}

	static setting (key, value = null) {
		if (value !== null) {
			Monogatari._settings[key] = value;
		} else {
			if (typeof Monogatari._settings[key] !== 'undefined') {
				return Monogatari._settings[key];
			} else {
				console.error (`Tried to access non existent setting with name '${key}'.`);
			}
		}
	}

	static settings (object = null) {
		if (object !== null) {
			Monogatari._settings = Object.assign ({}, Monogatari._settings, object);
		} else {
			return Monogatari._settings;
		}
	}

	static preference (key, value = null) {
		if (value !== null) {
			Monogatari._preferences[key] = value;
			Storage.update ('Settings', Monogatari._preferences);
		} else {
			if (typeof Monogatari._preferences[key] !== 'undefined') {
				return Monogatari._preferences[key];
			} else {
				console.error (`Tried to access non existent preference with name '${key}'.`);
			}
		}
	}

	static preferences (object = null) {
		if (object !== null) {
			Monogatari._preferences = Object.assign ({}, Monogatari._preferences, object);
			Storage.update ('Settings', Monogatari._preferences);
		} else {
			return Monogatari._preferences;
		}
	}

	static status (object = null) {
		if (object !== null) {
			Monogatari._status = Object.assign ({}, Monogatari._status, object);
		} else {
			return Monogatari._status;
		}
	}

	static storage (object = null) {
		if (object !== null) {
			Monogatari._storage = Object.assign ({}, Monogatari._storage, object);
		} else {
			return Monogatari._storage;
		}
	}

	static script (object = null) {
		if (typeof object === 'object' && object !== null) {
			Monogatari._script = Object.assign ({}, Monogatari._script, object);
		} else if (typeof object === 'string') {
			return Monogatari._script[object];
		} else {
			return Monogatari._script;
		}
	}

	static label (key, language = null, value = null) {
		if (typeof language === 'string' && value !== null) {
			if (typeof Monogatari._script[language] !== 'object') {
				Monogatari._script[language] = {};
			}
			Monogatari._script[language][key] = value;
		} else if (typeof language === 'object' && value === null) {
			if (typeof Monogatari._script[key] !== 'object') {
				Monogatari._script[key] = [];
			}
			Monogatari._script[key] = language;
		} else if (typeof language === 'string' && value === null) {
			return Monogatari._script[language][key];
		} else {
			return Monogatari._script[key];
		}
	}

	static fn (name, { apply = () => true, revert = () => true }) {
		if (typeof apply !== 'function' && typeof revert !== 'function') {
			return Monogatari._functions [name];
		} else {
			Monogatari._functions [name] = {
				apply,
				revert
			};
		}
	}

	///////////////


	/**
	 * Localize every element with a data-string property using the translations
	 * available. If no translation is found for the current language, the current
	 * text of the element will be kept.
	 */
	static localize () {
		$_('[data-string]').each ((element) => {
			const string_translation = Monogatari.string ($_(element).data ('string'));

			// Check if the translation actually exists and is not empty before
			//replacing the text.
			if (typeof string_translation !== 'undefined' && string_translation !== '') {
				$_(element).text (string_translation);
			}
		});
		Monogatari.setSlots ();
	}

	/**
	 * Preload game assets
	 */
	static preload () {
		const promises = [];
		let assetCount = 0;

		// Check if asset preloading is enabled. Preloading will not be done in
		// electron or cordova since the assets are expected to be available
		// locally.
		if (Monogatari.setting ('Preload') && !Platform.electron () && !Platform.cordova ()) {

			// Show loading screen
			$_('[data-menu="loading"]').show ();

			// Start by loading the image assets
			for (const key in Monogatari.assets ('scenes')) {
				promises.push (Preload.image ('img/scenes/' + Monogatari.asset ('scenes', key)).finally (() => {
					$_('[data-ui="load-progress"]').value (parseInt($_('[data-ui="load-progress"]').value ()) + 1);
				}));
				assetCount += 1;
			}

			for (const key in Monogatari.assets ('images')) {
				promises.push (Preload.image ('img/' + Monogatari.asset ('images', key)).finally (() => {
					$_('[data-ui="load-progress"]').value (parseInt($_('[data-ui="load-progress"]').value ()) + 1);
				}));
				assetCount += 1;
			}

			for (const character in Monogatari.characters ()) {
				let directory = '';

				// Check if the character has a directory defined where its images
				// are located
				if (typeof character.Directory !== 'undefined') {
					directory = character.Directory + '/';
				}

				if (typeof character.Images !== 'undefined') {
					for (const image of Object.values (character.Images)) {
						promises.push (Preload.image ('img/characters/' + directory + image).finally (() => {
							$_('[data-ui="load-progress"]').value (parseInt($_('[data-ui="load-progress"]').value ()) + 1);
						}));
					}
					assetCount += 1;
				}

				if (typeof character.Side !== 'undefined') {
					for (const image of Object.values (character.Side)) {
						promises.push (Preload.image ('img/characters/' + directory + image).finally (() => {
							$_('[data-ui="load-progress"]').value (parseInt($_('[data-ui="load-progress"]').value ()) + 1);
						}));
					}
					assetCount += 1;
				}

				if (typeof character.Face !== 'undefined') {
					promises.push (Preload.image ('img/characters/' + directory + character.Face).finally (() => {
						$_('[data-ui="load-progress"]').value (parseInt($_('[data-ui="load-progress"]').value ()) + 1);
					}));
					assetCount += 1;
				}
			}

			// Load the audio assets
			for (const key in Monogatari.assets ('music')) {
				promises.push (Preload.file ('audio/music/' + Monogatari.asset ('music', key)).finally (() => {
					$_('[data-ui="load-progress"]').value (parseInt($_('[data-ui="load-progress"]').value ()) + 1);
				}));
				assetCount += 1;
			}

			for (const key in Monogatari.assets ('voice')) {
				promises.push (Preload.file ('audio/voice/' + Monogatari.asset ('voice', key)).finally (() => {
					$_('[data-ui="load-progress"]').value (parseInt($_('[data-ui="load-progress"]').value ()) + 1);
				}));
				assetCount += 1;
			}

			for (const key in Monogatari.assets ('sound')) {
				promises.push (Preload.file ('audio/sound/' + Monogatari.asset ('sound', key)).finally (() => {
					$_('[data-ui="load-progress"]').value (parseInt($_('[data-ui="load-progress"]').value ()) + 1);
				}));
				assetCount += 1;
			}

			$_('[data-ui="load-progress"]').attribute ('max', assetCount);
			return Promise.all (promises);
		} else {
			return Promise.resolve ();
		}
	}

	static replaceVariables (statement) {
		const matches = statement.match (/{{\S+}}/g);
		if (matches !== null) {
			for (const match of matches) {
				const path = match.replace ('{{', '').replace ('}}', '').split ('.');

				let data = Monogatari.storage ()[path[0]];

				for (let j = 1; j < path.length; j++) {
					data = data[path[j]];
				}
				statement = statement.replace (match, data);
			}
		}
		return statement;
	}

	static addSlot (i, data) {
		const name = data.Name ? data.Name : data.Date;
		if (typeof Monogatari.assets ('scenes', data.Engine.Scene) !== 'undefined') {

			$_('[data-menu="load"] [data-ui="saveSlots"] [data-ui="slots"]').append (`
				<figure data-load-slot='${i}' class='row__column row_column--6 row__column--tablet--4 row__column--desktop--3 row__column--desktop-large--3 animated flipInX'>
					<button class='fas fa-times' data-delete='${i}'></button>
					<img src='img/scenes/${Monogatari.assets ('scenes', data.Engine.Scene)}' alt=''>
					<figcaption>${Monogatari.string ('Load')} #${i} <small>${name}</small></figcaption>
				</figure>
			`);

			$_('[data-menu="save"] [data-ui="slots"]').append (`
				<figure data-save='${i}' class='row__column row_column--6 row__column--tablet--4 row__column--desktop--3 row__column--desktop-large--3'>
					<button class='fas fa-times' data-delete='${i}'></button>
					<img src='img/scenes/${Monogatari.assets ('scenes', data.Engine.Scene)}' alt=''>
					<figcaption>${Monogatari.string ('Overwrite')} #${i}<small>${name}</small></figcaption>
				</figure>
			`);

		} else {
			$_('[data-menu="load"] [data-ui="saveSlots"] [data-ui="slots"]').append (`
				<figure data-load-slot='${i}' class='row__column row_column--6 row__column--tablet--4 row__column--desktop--3 row__column--desktop-large--3 animated flipInX'>
					<button class='fas fa-times' data-delete=${i}></button>
					<figcaption>${Monogatari.string ('Load')} #${i} <small>${name}</small></figcaption>
				</figure>
			`);

			$_('[data-menu="save"] [data-ui="slots"]').append (`
				<figure data-save='${i}' class='row__column row_column--6 row__column--tablet--4 row__column--desktop--3 row__column--desktop-large--3'>
					<button class='fas fa-times' data-delete=${i}></button>
					<figcaption>${Monogatari.string ('Overwrite')} #${i}<small>${name}</small></figcaption>
				</figure>
			`);
		}
	}

	static addAutoSlot (i, data) {
		const name = data.Name ? data.Name : data.Date;

		if (typeof Monogatari.assets ('scenes', data.Engine.Scene) !== 'undefined') {
			$_('[data-menu="load"] [data-ui="autoSaveSlots"] [data-ui="slots"]').append (`
				<figure data-load-slot='${i}' class='row__column row_column--6 row__column--tablet--4 row__column--desktop--3 row__column--desktop-large--3 animated flipInX'>
					<button class='fas fa-times' data-delete=${i}></button>
					<img src='img/scenes/${Monogatari.assets ('scenes', data.Engine.Scene)}' alt=''>
					<figcaption>${Monogatari.string ('Load')} #${i} <small>${name}</small></figcaption>
				</figure>
			`);
		} else {
			$_('[data-menu="load"] [data-ui="autoSaveSlots"] [data-ui="slots"]').append (`
				<figure data-load-slot='${i}' class='row__column row_column--6 row__column--tablet--4 row__column--desktop--3 row__column--desktop-large--3 animated flipInX'>
					<button class='fas fa-times' data-delete=${i}></button>
					<figcaption>${Monogatari.string ('Load')} #${i} <small>${name}</small></figcaption>
				</figure>
			`);
		}
	}

	static setAutoSlots () {
		if (!window.localStorage) {
			return false;
		}

		const element = $_('[data-menu="load"] [data-ui="autoSaveSlots"] [data-ui="slots"]');

		element.html ('');

		Storage.keys ().then ((keys) => {
			const savedData = keys.filter ((key) => {
				return key.indexOf (Monogatari.setting ('AutoSaveLabel')) === 0;
			}).sort ((a, b) => {
				const aNumber = parseInt (a.split (Monogatari.setting ('AutoSaveLabel'))[1]);
				const bNumber = parseInt (b.split (Monogatari.setting ('AutoSaveLabel'))[1]);

				if (aNumber > bNumber) {
					return 1;
				} else if (aNumber < bNumber) {
					return -1;
				} else {
					return 0;
				}
			});

			for (let i = 0; i < savedData.length; i++) {
				const label = savedData[i];
				if (label.indexOf (Monogatari.setting ('AutoSaveLabel')) === 0) {
					Storage.get (savedData[i]).then ((slot) => {
						const id = label.split (Monogatari.setting ('AutoSaveLabel'))[1];
						if (slot !== null && slot !== '') {
							Monogatari.addAutoSlot (id, slot);
						}
					});
				}
			}

			// Check if there are no Auto Saved games.
			if (element.html ().trim () === '') {
				element.html (`<p>${Monogatari.string ('NoAutoSavedGames')}</p>`);
			}
		});
	}

	// Create all save and load slots
	static setSlots () {
		if (!window.localStorage) {
			return false;
		}

		$_('[data-menu="load"] [data-ui="saveSlots"] [data-ui="slots"]').html ('');
		$_('[data-menu="save"] [data-ui="slots"]').html ('');

		$_('[data-menu="save"] [data-input="slotName"]').value (Monogatari.niceDateTime ());

		return Storage.keys ().then ((keys) => {
			const savedData = keys.filter ((key) => {
				return key.indexOf (Monogatari.setting ('SaveLabel')) === 0;
			}).sort ((a, b) => {
				const aNumber = parseInt (a.split (Monogatari.setting ('SaveLabel'))[1]);
				const bNumber = parseInt (b.split (Monogatari.setting ('SaveLabel'))[1]);

				if (aNumber > bNumber) {
					return 1;
				} else if (aNumber < bNumber) {
					return -1;
				} else {
					return 0;
				}
			});

			const promises = [];
			for (let i = 0; i < savedData.length; i++) {
				const label = savedData[i];
				promises.push(Storage.get (label).then ((slot) => {
					const id = label.split (Monogatari.setting ('SaveLabel'))[1];
					if (slot !== null && slot !== '') {
						Monogatari.addSlot (id, slot);
					}
				}));
			}

			return Promise.all (promises).then (() => {

				// Check if there are no Saved games.
				if ($_('[data-menu="load"] [data-ui="saveSlots"] [data-ui="slots"]').html ().trim() === '') {
					$_('[data-menu="save"] [data-ui="slots"]').html (`<p>${Monogatari.string ('NoSavedGames')}</p>`);
				}
				Monogatari.setAutoSlots ();
			});
		});
	}

	// Get's the highest number currently available as a slot id (Save_{?})
	static getMaxSlotId () {
		return Storage.keys ().then ((keys) => {
			let max = 1;
			for (const saveKey of keys) {
				if (saveKey.indexOf (Monogatari.setting ('SaveLabel')) === 0) {
					const number = parseInt(saveKey.split (Monogatari.setting ('SaveLabel'))[1]);
					if (number > max) {
						max = number;
					}
				}
			}
			return max;
		});
	}

	static newSave (name) {
		// Check if the player is actually playing
		if (globals.playing) {
			document.body.style.cursor = 'wait';

			// Get a list of all the images being shown in screen except the
			// face images so they can be shown next time the slot is loaded
			let show = '';
			$_('#game img:not([data-ui="face"]):not([data-visibility="invisible"])').each ((element) => {
				show += element.outerHTML.replace(/"/g, '\'') + ',';
			});

			Monogatari.getMaxSlotId ().then ((max) => {
				Storage.set (Monogatari.setting ('SaveLabel') + (max + 1) , {
					'Name': name,
					'Date': Monogatari.niceDateTime (),
					'Engine': Monogatari.settings (),
					'Show': show,
					'Label': Monogatari.setting ('Label'),
					'Storage': Monogatari.storage ()
				}).then (({key, value}) => {
					Monogatari.addSlot (max + 1, value);
					document.body.style.cursor = 'auto';
				});
			});
		}
	}

	static autoSave (id, slot) {
		if (globals.playing) {
			document.body.style.cursor = 'wait';

			// Get a list of all the images being shown in screen except the
			// face images so they can be shown next time the slot is loaded
			let show = '';
			$_('#game img:not([data-ui="face"]):not([data-visibility="invisible"])').each ((element) => {
				show += element.outerHTML.replace(/"/g, '\'') + ',';
			});

			const name = Monogatari.niceDateTime ();

			Storage.set (slot, {
				'Name': name,
				'Date': name,
				'Engine': Monogatari.settings (),
				'Show': show,
				'Label': Monogatari.setting ('Label'),
				'Storage': Monogatari.storage ()
			}).then (() => {
				$_(`[data-menu='load'] [data-ui='autoSaveSlots'] [data-ui='slots'] [data-load-slot='${id}'] small`).text (name);
				$_(`[data-menu='save'] [data-ui='autoSaveSlots'] [data-ui='slots'] [data-save='${id}'] small`).text (name);
				document.body.style.cursor = 'auto';
			});
		}
	}

	static saveToSlot (id, slot, customName) {
		// Check if the player is actually playing
		if (globals.block) {
			document.body.style.cursor = 'wait';

			// Get a list of all the images being shown in screen except the
			// face images so they can be shown next time the slot is loaded
			let show = '';
			$_('#game img:not([data-ui="face"]):not([data-visibility="invisible"])').each ((element) => {
				show += element.outerHTML.replace(/"/g, '\'') + ',';
			});

			// Get the name of the Slot if it exists or use the current date.
			Storage.get (slot).then ((data) => {
				let name;

				if (data !== null && data !== '') {
					data = JSON.parse (data);
					if (data.Name !== null && data.Name !== '' && typeof data.Name !== 'undefined') {
						name = data.Name;
					} else {
						name = Monogatari.niceDateTime ();
					}
				} else {
					name = Monogatari.niceDateTime ();
				}

				if (typeof customName !== 'undefined') {
					name = customName;
				}

				Storage.set (slot, {
					'Name': name,
					'Date': Monogatari.niceDateTime (),
					'Engine': Monogatari.settings (),
					'Show': show,
					'Label': Monogatari.setting ('Label'),
					'Storage': Monogatari.storage ()
				}).then (() => {
					$_(`[data-menu='load'] [data-ui='saveSlots'] [data-ui='slots'] [data-load-slot='${id}'] small`).text (name);
					$_(`[data-menu='save'] [data-ui='slots'] [data-save='${id}'] small`).text (name);
					document.body.style.cursor = 'auto';
				});
			});
		}
	}

	static loadFromSlot (slot) {
		document.body.style.cursor = 'wait';
		globals.playing = true;

		Monogatari.resetGame ();

		$_('section').hide();
		$_('#game').show();
		Storage.get (slot).then ((data) => {
			Monogatari.settings ({
				'Label': data.Engine.Label,
				'Song': data.Engine.Song,
				'Sound': data.Engine.Sound,
				'Scene': data.Engine.Scene,
				'Particles': data.Engine.Particles,
				'Step': data.Engine.Step,
				'MusicHistory': data.Engine.MusicHistory,
				'SoundHistory': data.Engine.SoundHistory,
				'ImageHistory': data.Engine.ImageHistory,
				'CharacterHistory': data.Engine.CharacterHistory,
				'SceneHistory': data.Engine.SceneHistory,
				'SceneElementsHistory': data.Engine.SceneElementsHistory,
				'ParticlesHistory': data.Engine.ParticlesHistory
			});
			Monogatari.storage (Object.assign({}, JSON.parse(globals.storageStructure), data.Storage));

			globals.label = globals.game[data.Label];

			for (const i in data.Show.split(',')) {
				if (data.Show.split(',')[i].trim() != '') {
					$_('#game').append(data.Show.split(',')[i]);
				}
			}

			$_('[data-ui="background"]').fadeOut(200, function () {

				if (typeof Monogatari.assets ('scenes', data.Engine.Scene) !== 'undefined') {
					$_('[data-ui="background"]').style('background', 'url(img/scenes/' + Monogatari.assets ('scenes', data.Engine.Scene) + ') center / cover no-repeat');
				} else {
					$_('[data-ui="background"]').style('background', data.Engine.Scene);
				}

				$_('[data-ui="background"]').fadeIn(200);
			});

			if (Monogatari.setting ('Song') != '') {
				const parts = Monogatari.setting ('Song').split (' ');
				if (parts[1] == 'music') {

					if (parts[3] == 'loop') {
						Monogatari.musicPlayer.setAttribute('loop', '');
					} else if (parts[3] == 'noloop') {
						Monogatari.musicPlayer.removeAttribute('loop');
					}

					if (typeof Monogatari.assets ('music', parts[2]) != 'undefined') {
						Monogatari.musicPlayer.setAttribute('src', 'audio/music/' + Monogatari.assets ('music', parts[2]));
					} else {
						Monogatari.musicPlayer.setAttribute('src', 'audio/music/' + parts[2]);
					}

					Monogatari.musicPlayer.play();
				}
			}

			if (Monogatari.setting ('Sound') != '') {
				const parts = Monogatari.setting ('Sound').split (' ');
				if (parts[1] == 'sound') {
					if (parts[3] == 'loop') {
						Monogatari.soundPlayer.setAttribute('loop', '');
					} else if (parts[3] == 'noloop') {
						Monogatari.soundPlayer.removeAttribute('loop');
					}

					if (typeof  Monogatari.assets ('sound', parts[2]) != 'undefined') {
						Monogatari.soundPlayer.setAttribute('src', 'audio/sound/' + Monogatari.assets ('sound', parts[2]));
					} else {
						Monogatari.soundPlayer.setAttribute('src', 'audio/sound/' + parts[2]);
					}

					Monogatari.soundPlayer.play();
				}
			}

			if (Monogatari.setting ('Particles') != '' && typeof Monogatari.setting ('Particles') == 'string') {
				if (typeof particles[Monogatari.setting ('Particles')] !== 'undefined') {
					particlesJS (particles[Monogatari.setting ('Particles')]);
				}
			}

			$_('#game').show();
			Monogatari.run(globals.label[Monogatari.setting ('Step')]);
			document.body.style.cursor = 'auto';
		});
	}

	static niceDateTime () {
		return new Date ().toLocaleString ();
	}

	static stopParticles () {
		try {
			if (typeof pJSDom === 'object') {
				if (pJSDom.length > 0) {
					for (let i = 0; i < pJSDom.length; i++) {
						if (typeof pJSDom[i].pJS !== 'undefined') {
							cancelAnimationFrame (pJSDom[i].pJS.fn.drawAnimFrame);
							pJSDom.shift ();
						}
					}
				}
			}
		} catch (e) {
			console.error ('An error ocurred while trying to stop particle system.');
		}

		Monogatari.setting ('Particles', '');
		$_('#particles-js').html ('');
	}

	static hideCentered () {
		$_('[data-ui="centered"]').remove ();
		$_('[data-ui="text"]').show ();
	}

	// Assert the result of a function
	static assertAsync (callable, self = null, args = null) {
		globals.block = true;
		return new Promise (function (resolve, reject) {
			const result = callable.apply(self, args);
			// Check if the function returned a simple boolean
			// if the return value is true, the game will continue
			if (typeof result === 'boolean') {
				if (result) {
					resolve ();
				} else {
					reject ();
				}
			} else if (typeof result === 'object') {
				// Check if the result was a promise
				if (typeof result.then != 'undefined') {

					result.then(function (value) {
						if (typeof value === 'boolean') {
							if (value) {
								resolve ();
							} else {
								reject ();
							}
						}
					});
				} else {
					resolve ();
				}
			} else {
				reject ();
			}
		});
	}

	static canProceed () {
		if (!$_('[data-ui="choices"]').isVisible ()
			&& $_('#game').isVisible ()
			&& !$_('[data-component="modal"]').isVisible ()
			&& (
				$_('[data-ui="text"]').isVisible ()
				|| (
					!$_('[data-ui="text"]').isVisible ()
					&& $_('[data-ui="centered"]').isVisible ()
				)
			)
			&& !$_('[data-component="video"]').isVisible ()
			&& !globals.block) {
			return true;
		} else {
			return false;
		}
	}

	static playAmbient () {
		if (Monogatari.setting ('MenuMusic') !== '') {
			Monogatari.ambientPlayer.setAttribute ('loop', '');

			if (typeof Monogatari.assets ('music', Monogatari.setting ('MenuMusic')) !== 'undefined') {
				Monogatari.ambientPlayer.setAttribute('src', 'audio/music/' + Monogatari.assets ('music', Monogatari.setting ('MenuMusic')));
			} else {
				Monogatari.ambientPlayer.setAttribute('src', 'audio/music/' + Monogatari.setting ('MenuMusic'));
			}
			Monogatari.ambientPlayer.play();
		}
	}

	// Stop any playing music or sound
	static silence () {
		for (let i = 0; i < document.getElementsByTagName ('audio').length; i++) {
			const v = document.getElementsByTagName ('audio');
			if (!v[i].paused && typeof v[i].src != 'undefined' && v[i].src != '') {
				v[i].pause();
				v[i].currentTime = 0;
			}
		}
	}

	// Stop the main menu's music
	static stopAmbient () {
		if (!Monogatari.ambientPlayer.paused) {
			Monogatari.ambientPlayer.pause ();
		}
	}

	// Stop the voice player
	static shutUp () {
		if (!Monogatari.voicePlayer.paused && typeof Monogatari.voicePlayer.src !== 'undefined' && Monogatari.voicePlayer.src != '') {
			Monogatari.voicePlayer.pause ();
			Monogatari.voicePlayer.currentTime = 0;
		}
	}

	static stopVideo () {
		Monogatari.videoPlayer.pause ();
		Monogatari.videoPlayer.currentTime = 0;
		Monogatari.videoPlayer.setAttribute ('src', '');
		$_('[data-component="video"]').removeClass ('active');
	}


	static changeWindowResolution (resolution) {
		if (Platform.electron ()) {
			const remote = require ('electron').remote;
			const win = remote.getCurrentWindow ();
			const {width, height} = remote.screen.getPrimaryDisplay ().workAreaSize;
			if (resolution) {
				win.setResizable (true);

				if (resolution == 'fullscreen' && !win.isFullScreen () && win.isFullScreenable ()) {
					win.setFullScreen(true);
					Monogatari.preference ('Resolution', resolution);
				} else if (resolution.indexOf ('x') > -1) {
					win.setFullScreen (false);
					const size = resolution.split ('x');
					const chosenWidth = parseInt (size[0]);
					const chosenHeight = parseInt (size[1]);

					if (chosenWidth <= width && chosenHeight <= height) {
						win.setSize(chosenWidth, chosenHeight, true);
						Monogatari.preference ('Resolution', resolution);
					}
				}
				win.setResizable (false);
			}
		}
	}

	static electronSetup () {
		// Set the electron quit handler.
		if (Platform.electron ()) {
			const remote = require ('electron').remote;
			const win = remote.getCurrentWindow ();

			$_('[data-action="set-resolution"]').value (Monogatari.preference ('Resolution'));

			window.addEventListener ('beforeunload', (event) => {
				event.preventDefault ();
				$_('[data-notice="exit"]').addClass ('modal--active');
			});

			if (!win.isResizable ()) {
				const aspectRatio = Monogatari.setting ('AspectRatio').split (':');
				const aspectRatioWidth = parseInt (aspectRatio[0]);
				const aspectRatioHeight = parseInt (aspectRatio[1]);
				win.setResizable (true);
				const minSize = win.getMinimumSize ();
				const {width, height} = remote.screen.getPrimaryDisplay ().workAreaSize;
				win.setResizable (false);

				for (let i = 0; i < 488; i+=8) {
					const calculatedWidth = aspectRatioWidth * i;
					const calculatedHeight = aspectRatioHeight * i;

					if (calculatedWidth >= minSize[0] && calculatedHeight >= minSize[1] && calculatedWidth <= width && calculatedHeight <= height) {
						$_('[data-action="set-resolution"]').append(`<option value="${calculatedWidth}x${calculatedHeight}">${Monogatari.string ('Windowed')} ${calculatedWidth}x${calculatedHeight}</option>`);
					}
				}

				$_('[data-action="set-resolution"]').append(`<option value="fullscreen">${Monogatari.string ('FullScreen')}</option>`);

				if (typeof Monogatari.preference ('Resolution') != 'undefined') {
					Monogatari.changeWindowResolution (Monogatari.preference ('Resolution'));
				}
				$_('[data-action="set-resolution"]').change(function () {
					const size = $_(this).value ();
					Monogatari.changeWindowResolution (size);
				});
			} else {
				$_('[data-settings="resolution"]').hide ();
			}

		} else {
			$_('[data-platform="electron"]').hide ();
		}
	}

	static whipeText () {
		if (globals.textObject !== null) {
			globals.textObject.destroy ();
		}
		$_('[data-ui="who"]').html ('');
		$_('[data-ui="say"]').html ('');
	}

	static hideGameElements () {
		// Hide in-game elements
		$_('[data-ui="choices"]').hide ();
		$_('[data-ui="choices"]').html ('');

		$_('[data-component="modal"]').removeClass ('modal--active');
		$_('[data-ui="messages"]').removeClass ('modal--active');
		$_('[data-component="video"]').removeClass ('modal--active');

		$_('[data-ui="centered"]').remove ();
		$_('#game [data-character]').remove ();
		$_('#game [data-image]').remove ();

		$_('[data-ui="input"] [data-ui="warning"]').text ('');

		$_('[data-ui="background"]').style ('background', 'initial');
		Monogatari.whipeText ();
	}

	static resetGame () {
		Monogatari.stopVideo();
		Monogatari.silence();
		Monogatari.hideGameElements();

		clearInterval (globals.autoPlay);
		globals.autoPlay = null;

		$_('[data-action="auto-play"].fa').removeClass ('fa-stop-circle');
		$_('[data-action="auto-play"].fa').addClass ('fa-play-circle');

		// Reset Storage
		Monogatari.storage (JSON.parse(globals.storageStructure));

		// Reset Conditions
		Monogatari.setting ('Label', Monogatari.setting ('startLabel'));
		globals.label = globals.game[Monogatari.setting ('Label')];
		Monogatari.setting ('Step', 0);

		// Reset History
		Monogatari.setting ('MusicHistory', []);
		Monogatari.setting ('SoundHistory', []);
		Monogatari.setting ('ImageHistory', []);
		Monogatari.setting ('CharacterHistory', []);
		Monogatari.setting ('SceneHistory', []);
		Monogatari.setting ('SceneElementsHistory', []);
		Monogatari.setting ('ParticlesHistory', []);

		// Reset other States
		Monogatari.setting ('Sound', '');
		Monogatari.setting ('Song', '');
		Monogatari.setting ('Particles', '');
		Monogatari.setting ('Scene', '');
	}

	static endGame () {
		globals.playing = false;

		Monogatari.resetGame ();

		// Show main menu
		$_('section').hide ();
		Monogatari.playAmbient ();
		$_('[data-menu="main"]').show ();
	}

	static next () {
		Monogatari.setting ('Step', Monogatari.setting ('Step') + 1);
		Monogatari.run (globals.label[Monogatari.setting ('Step')]);
	}

	static displayDialog (dialog, character, animation) {

		// Destroy the Monogatari.previous textObject so the text is rewritten.
		// If not destroyed, the text would be appended instead of replaced.
		if (globals.textObject !== null) {
			globals.textObject.destroy ();
		}

		// Remove contents from the dialog area.
		$_('[data-ui="say"]').html ('');
		$_('[data-ui="say"]').data ('speaking', character);

		// Check if the typing animation flag is set to true in order to show it
		if (animation === true) {

			// If the property is set to true, the animation will be shown
			// if it is set to false, even if the flag was set to true,
			// no animation will be shown in the game.
			if (Monogatari.setting ('TypeAnimation') === true) {
				globals.typedConfiguration.strings = [dialog];
				globals.textObject = new Typed ('[data-ui="say"]', globals.typedConfiguration);
			} else {
				$_('[data-ui="say"]').html (dialog);
				if (globals.autoPlay !== null) {
					globals.autoPlay = setTimeout (() => {
						if (Monogatari.canProceed () && globals.finishedTyping) {
							Monogatari.hideCentered ();
							Monogatari.shutUp ();
							Monogatari.next ();
						}
					}, Monogatari.preference ('AutoPlaySpeed') * 1000);
				}
				globals.finishedTyping = true;
			}
		} else {
			$_('[data-ui="say"]').html (dialog);
			if (globals.autoPlay !== null) {
				globals.autoPlay = setTimeout (() => {
					if (Monogatari.canProceed() && globals.finishedTyping) {
						Monogatari.hideCentered();
						Monogatari.shutUp();
						Monogatari.next ();
					}
				}, Monogatari.preference ('AutoPlaySpeed') * 1000);
			}
			globals.finishedTyping = true;
		}
	}

	// Start game automatically withouth going trough the main menu
	static showMainMenu () {
		if (!Monogatari.setting ('ShowMenu')) {
			Monogatari.stopAmbient ();
			globals.playing = true;
			$_('section').hide ();
			$_('#game').show ();
			Monogatari.run (globals.label[Monogatari.setting ('Step')]);
		} else {
			$_('[data-menu="main"]').show ();
		}
	}

	// Function to execute the previous statement in the script.
	static previous () {

		Monogatari.hideCentered();
		Monogatari.shutUp();
		if (Monogatari.setting ('Step') >= 1) {
			Monogatari.setting ('Step', Monogatari.setting ('Step') - 1);
			const back = ['show', 'play', 'display', 'hide', 'stop', 'particles', 'wait', 'scene', 'clear', 'vibrate', 'notify', 'next'];
			let flag = true;
			try {
				while (Monogatari.setting ('Step') > 0 && flag) {
					if (typeof globals.label[Monogatari.setting ('Step')] == 'string') {
						if (back.indexOf(globals.label[Monogatari.setting ('Step')].split(' ')[0]) > -1) {
							const parts = Monogatari.replaceVariables(globals.label[Monogatari.setting ('Step')]).split(' ');
							switch (parts[0]) {
								case 'show':
									if (typeof Monogatari.character (parts[1]) != 'undefined') {
										$_('[data-character="' + parts[1] + '"]').remove();
										if (Monogatari.setting ('CharacterHistory').length > 1) {
											Monogatari.setting ('CharacterHistory').pop();
										}

										const last_character = Monogatari.setting ('CharacterHistory').slice(-1)[0];
										if (typeof last_character != 'undefined') {
											if (last_character.indexOf('data-character="' + parts[1] + '"') > -1) {
												$_('#game').append(last_character);
											}
										}
									} else {
										if (typeof parts[3] != 'undefined' && parts[3] != '') {
											$_('[data-image="' + parts[1] + '"]').addClass(parts[3]);
										} else {
											$_('[data-image="' + parts[1] + '"]').remove();
										}
										Monogatari.setting ('ImageHistory').pop();
									}
									break;

								case 'play':
									if (parts[1] == 'music') {
										Monogatari.musicPlayer.removeAttribute('loop');
										Monogatari.musicPlayer.setAttribute('src', '');
										Monogatari.setting ('Song', '');
										Monogatari.musicPlayer.pause();
										Monogatari.musicPlayer.currentTime = 0;
									} else if (parts[1] == 'sound') {
										Monogatari.soundPlayer.removeAttribute('loop');
										Monogatari.soundPlayer.setAttribute('src', '');
										Monogatari.setting ('Sound', '');
										Monogatari.soundPlayer.pause();
										Monogatari.soundPlayer.currentTime = 0;
									}
									break;

								case 'stop':
									if (parts[1] == 'music') {
										const last_song = Monogatari.setting ('MusicHistory').pop().split(' ');

										if (last_song[3] == 'loop') {
											Monogatari.musicPlayer.setAttribute('loop', '');
										} else if (last_song[3] == 'noloop') {
											Monogatari.musicPlayer.removeAttribute('loop');
										}
										if (typeof  Monogatari.asset ('last_song[2]') !== 'undefined') {
											Monogatari.musicPlayer.setAttribute('src', 'audio/music/' + Monogatari.asset ('music', last_song[2]));
										} else {
											Monogatari.musicPlayer.setAttribute('src', 'audio/music/' + last_song[2]);
										}
										Monogatari.musicPlayer.play();
										Monogatari.setting ('Song', last_song.join(' '));
									} else if (parts[1] == 'sound') {
										const last = Monogatari.setting ('SoundHistory').pop().split(' ');

										if (last[3] == 'loop') {
											Monogatari.soundPlayer.setAttribute('loop', '');
										} else if (last[3] == 'noloop') {
											Monogatari.soundPlayer.removeAttribute('loop');
										}

										if (typeof  Monogatari.asset ('sound', last[2]) !== 'undefined') {
											Monogatari.soundPlayer.setAttribute('src', 'audio/sound/' + Monogatari.asset ('sound', last[2]));
										} else {
											Monogatari.soundPlayer.setAttribute('src', 'audio/sound/' + last[2]);
										}

										Monogatari.soundPlayer.play();
										Monogatari.setting ('Sound', last.join(' '));
									} else if (parts[1] == 'particles') {
										if (typeof Monogatari.setting ('ParticlesHistory') === 'object') {
											if (Monogatari.setting ('ParticlesHistory').length > 0) {
												var last_particles = Monogatari.setting ('ParticlesHistory').pop ();
												if (typeof particles[last_particles] !== 'undefined') {
													particlesJS (particles[last_particles]);
													Monogatari.setting ('Particles', last_particles);
												}
											}
										}
									}
									break;

								case 'scene':
									Monogatari.setting ('SceneHistory').pop();
									Monogatari.setting ('Scene', Monogatari.setting ('SceneHistory').slice(-1)[0]);

									if (typeof Monogatari.setting ('Scene') != 'undefined') {
										$_('[data-character]').remove();
										$_('[data-image]').remove();
										$_('[data-ui="background"]').removeClass ();

										if (typeof Monogatari.assets ('scenes', Monogatari.setting ('Scene')) !== 'undefined') {
											$_('[data-ui="background"]').style('background', 'url(img/scenes/' + Monogatari.assets ('scenes', Monogatari.setting ('Scene')) + ') center / cover no-repeat');
										} else {
											$_('[data-ui="background"]').style('background', Monogatari.setting ('Scene'));
										}

										if (typeof  Monogatari.setting ('SceneElementsHistory') !== 'undefined') {
											if (Monogatari.setting ('SceneElementsHistory').length > 0) {
												var scene_elements = Monogatari.setting ('SceneElementsHistory').pop ();

												if (typeof scene_elements === 'object') {
													for (const element of scene_elements) {
														$_('#game').append (element);
													}
												}
											}
										} else {
											Monogatari.setting ('SceneElementsHistory', []);
										}
									}

									Monogatari.whipeText();
									break;

								case 'display':
									if (parts[1] == 'message') {
										$_('[data-ui="message-content"]').html('');
										$_('[data-ui="messages"]').removeClass('active');
									} else if (parts[1] == 'image') {
										$_('[data-image="' + parts[2] + '"]').remove();
									}
									break;
								case 'hide':
									if (typeof Monogatari.character (parts[1]) != 'undefined' && Monogatari.setting ('CharacterHistory').length > 0) {
										$_('#game').append(Monogatari.setting ('CharacterHistory').pop());

									} else if (typeof Monogatari.assets ('images', parts[1]) != 'undefined' && Monogatari.setting ('ImageHistory') > 0) {
										$_('#game').append(Monogatari.setting ('ImageHistory').pop());

									} else {
										flag = false;
										Monogatari.setting ('Step', Monogatari.setting ('Step') + 1);
									}
									break;

								case 'particles':
									Monogatari.stopParticles ();
									break;
								default:
									flag = false;
									break;
							}
							if ((Monogatari.setting ('Step') - 1) >= 0) {
								Monogatari.setting ('Step', Monogatari.setting ('Step') - 1);
							}
						} else {
							flag = false;
						}
					} else if (typeof globals.label[Monogatari.setting ('Step')] == 'object') {
						if (typeof globals.label[Monogatari.setting ('Step')].Function !== 'undefined') {
							Monogatari.assertAsync(globals.label[Monogatari.setting ('Step')].Function.Reverse, Monogatari).finally (() => {
								globals.block = false;
							});
						} else if (typeof globals.label[Monogatari.setting ('Step')].$ !== 'undefined') {
							const fn = Monogatari.fn (globals.label[Monogatari.setting ('Step')].$.name);
							if (typeof fn  !== 'undefined') {
								if (typeof fn.apply  !== 'undefined') {
									Monogatari.assertAsync (fn.revert, Monogatari).finally (() => {
										globals.block = false;
									});
								}
							}
						}
						if ((Monogatari.setting ('Step') - 1) >= 0) {
							Monogatari.setting ('Step', Monogatari.setting ('Step') - 1);
						}
					} else {
						flag = false;
						Monogatari.setting ('Step',  Monogatari.setting ('Step') + 1);
					}
				}
				Monogatari.run (globals.label[Monogatari.setting ('Step')]);
			} catch (e) {
				console.error('An error ocurred while trying to exectute the Monogatari.previous statement.\n' + e);
			}
		}
	}

	static run (statement, advance) {
		if (typeof advance !== 'boolean') {
			advance = true;
		}
		try {

			switch (typeof statement) {
				case 'string':
					statement = Monogatari.replaceVariables (statement);
					var parts = statement.split (' ');

					switch (parts[0]) {

						case 'wait':
							globals.block = true;
							setTimeout (() => {
								globals.block = false;
								if (advance) {
									Monogatari.next ();
								}
							}, parseInt (parts[1]));
							break;

						case 'play':

							if (parts[1] == 'music') {

								if (parts[3] == 'loop') {
									Monogatari.musicPlayer.setAttribute ('loop', '');
								} else if (parts[3] == 'noloop') {
									Monogatari.musicPlayer.removeAttribute ('loop');
								}

								if (Monogatari.asset ('music', parts[2]) !== 'undefined') {
									Monogatari.musicPlayer.setAttribute('src', 'audio/music/' + Monogatari.asset ('music', parts[2]));
								} else {
									Monogatari.musicPlayer.setAttribute('src', 'audio/music/' + parts[2]);
								}
								Monogatari.musicPlayer.play();
								Monogatari.setting ('Song', parts.join(' '));
								Monogatari.setting ('MusicHistory').push(Monogatari.setting ('Song'));
								if (advance) {
									Monogatari.next ();
								}
							} else if (parts[1] == 'sound') {
								if (parts[3] == 'loop') {
									Monogatari.soundPlayer.setAttribute('loop', '');
								} else if (parts[3] == 'noloop') {
									Monogatari.soundPlayer.removeAttribute('loop');
								}
								if (typeof Monogatari.asset ('sound', parts[2]) !== 'undefined') {
									Monogatari.soundPlayer.setAttribute('src', 'audio/sound/' + Monogatari.asset ('sound', parts[2]));
								} else {
									Monogatari.soundPlayer.setAttribute('src', 'audio/sound/' + parts[2]);
								}

								Monogatari.soundPlayer.play();
								Monogatari.setting ('Sound', parts.join(' '));
								Monogatari.setting ('SoundHistory').push(Monogatari.setting ('Sound'));
								if (advance) {
									Monogatari.next ();
								}
							} else if (parts[1] == 'voice') {

								if (typeof Monogatari.asset ('voice', parts[2]) !== 'undefined') {
									Monogatari.voicePlayer.setAttribute('src', 'audio/voice/' + Monogatari.assets ('voice', parts[2]));
								} else {
									Monogatari.voicePlayer.setAttribute('src', 'audio/voice/' + parts[2]);
								}

								Monogatari.voicePlayer.play();
								if (advance) {
									Monogatari.next ();
								}
							} else if (parts[1] == 'video') {

								if (typeof Monogatari.asset ('video', parts[2]) !== 'undefined') {
									Monogatari.videoPlayer.setAttribute('src', 'video/' + Monogatari.assets ('video', parts[2]));
								} else {
									Monogatari.videoPlayer.setAttribute('src', 'video/' + parts[2]);
								}

								$_('[data-component="video"]').addClass('active');
								Monogatari.videoPlayer.play();
							}

							break;

						case 'scene':

							var scene_elements = [];
							$_('#game img:not([data-ui="face"]):not([data-visibility="invisible"])').each(function (element) {
								scene_elements.push (element.outerHTML);
							});
							if (typeof Monogatari.setting ('SceneElementsHistory') !== 'object') {
								Monogatari.setting ('SceneElementsHistory', []);
							}
							Monogatari.setting ('SceneElementsHistory').push (scene_elements);

							$_('[data-character]').remove();
							$_('[data-image]').remove();
							$_('[data-ui="background"]').removeClass();

							// scene [scene]
							//   0      1
							if (typeof Monogatari.assets ('scenes', parts[1]) != 'undefined') {
								$_('[data-ui="background"]').style('background', 'url(img/scenes/' + Monogatari.assets ('scenes', parts[1]) + ') center / cover no-repeat');
							} else {
								$_('[data-ui="background"]').style('background', parts[1]);
							}

							// Check if an animation or class was provided
							// scene [scene] with [animation] [infinite]
							//   0      1     2       3           4
							if (parts.length > 2) {
								if (parts[2] == 'with' && parts[3].trim != '') {
									$_('[data-ui="background"]').addClass ('animated');
									var class_list = (parts.join(' ').replace ('scene ' + parts[1], '').replace (' with ', ' ')).trim ().split (' ');
									for (const newClass of class_list) {
										$_('[data-ui="background"]').addClass (newClass);
									}
								}
							}

							Monogatari.setting ('Scene', parts[1]);
							Monogatari.setting ('SceneHistory').push(parts[1]);
							Monogatari.whipeText();
							if (advance) {
								Monogatari.next ();
							}
							break;

						case 'show':
							// show [character] [expression] at [position] with [animation] [infinite]
							//   0      1             2       3     4        5       6         7

							// show [character] [expression] with [animation] [infinite]
							//   0      1             2       3       4         5

							// show [character] [expression]
							//   0      1             2
							var classes = '';
							if (typeof Monogatari.character (parts[1]) != 'undefined') {
								let directory = Monogatari.character (parts[1]).Directory;
								if (typeof directory == 'undefined') {
									directory = '';
								} else {
									directory += '/';
								}
								const image = Monogatari.character (parts[1]).Images[parts[2]];
								$_('[data-character="' + parts[1] + '"]').remove();

								if (parts[3] == 'at') {
									parts[3] == parts[4];
								}

								if (parts[3] == 'with' || typeof parts[3] == 'undefined') {
									parts[3] = 'center';
								}

								classes = parts.join(' ').replace('show ' + parts[1] +' '+ parts[2], '').replace(' at ', '').replace(' with ', ' ');


								$_('#game').append('<img src="img/characters/' + directory + image + '" class="animated ' + classes + '" data-character="' + parts[1] + '" data-sprite="' + parts[2] + '">');
								Monogatari.setting ('CharacterHistory').push('<img src="img/characters/' + directory + image + '" class="animated ' + classes + '" data-character="' + parts[1] + '" data-sprite="' + parts[2] + '">');

							} else {
								// show [image] at [position] with [animation]
								//   0     1     2      3      4        5

								// show [image] with [animation]
								//   0      1     2       3

								// show [image]
								//   0      1

								if (parts[2] == 'at') {
									parts[2] == parts[3];
								}

								if (parts[2] == 'with' || typeof parts[2] == 'undefined') {
									parts[2] = 'center';
								}

								let src = '';
								if (typeof Monogatari.assets ('images', parts[1]) != 'undefined') {
									src = Monogatari.assets ('images', parts[1]);
								} else {
									src = parts[1];
								}

								classes = parts.join(' ').replace('show ' + parts[1], '').replace(' at ', '').replace(' with ', ' ');

								const imageObject = '<img src="img/' + src + '" class="animated ' + classes + '" data-image="' + parts[1] + '" data-sprite="' + parts[1] + '">';
								$_('#game').append(imageObject);
								Monogatari.setting ('ImageHistory').push(imageObject);

							}
							if (advance) {
								Monogatari.next ();
							}
							break;

						case 'jump':
							Monogatari.setting ('Step', 0);
							globals.label = globals.game[parts[1]];
							Monogatari.setting ('Label', parts[1]);
							Monogatari.whipeText();
							Monogatari.run(globals.label[Monogatari.setting ('Step')]);
							break;

						case 'stop':
							if (parts[1] == 'music') {
								Monogatari.musicPlayer.removeAttribute('loop');
								Monogatari.musicPlayer.setAttribute('src', '');
								Monogatari.setting ('Song', '');
								Monogatari.musicPlayer.pause();
								Monogatari.musicPlayer.currentTime = 0;
							} else if (parts[1] == 'sound') {
								Monogatari.soundPlayer.removeAttribute('loop');
								Monogatari.soundPlayer.setAttribute('src', '');
								Monogatari.setting ('Sound', '');
								Monogatari.soundPlayer.pause();
								Monogatari.soundPlayer.currentTime = 0;
							} else if (parts[1] == 'particles') {
								Monogatari.stopParticles ();
							}
							if (advance) {
								Monogatari.next ();
							}
							break;

						case 'pause':
							if (parts[1] == 'music') {
								Monogatari.musicPlayer.pause();
							} else if (parts[1] == 'sound') {
								Monogatari.soundPlayer.pause();
							}
							if (advance) {
								Monogatari.next ();
							}
							break;

						case 'hide':
							if (typeof Monogatari.character (parts[1]) != 'undefined') {
								if (typeof parts[3] != 'undefined' && parts[3] != '') {
									$_('[data-character="' + parts[1] + '"]').addClass(parts[3]);
									$_('[data-character="' + parts[1] + '"]').data ('visibility', 'invisible');
								} else {
									$_('[data-character="' + parts[1] + '"]').remove();
								}

							} else if (typeof Monogatari.assets ('images', parts[1]) != 'undefined') {
								if (typeof parts[3] != 'undefined' && parts[3] != '') {
									$_('[data-image="' + parts[1] + '"]').addClass(parts[3]);
									$_('[data-image="' + parts[1] + '"]').data ('visibility', 'invisible');
								} else {
									$_('[data-image="' + parts[1] + '"]').remove();
								}

							} else {
								if (typeof parts[3] != 'undefined' && parts[3] != '') {
									$_('[data-image="' + parts[1] + '"]').addClass(parts[3]);
									$_('[data-image="' + parts[1] + '"]').data ('visibility', 'invisible');
								} else {
									$_('[data-image="' + parts[1] + '"]').remove();
								}
							}
							if (advance) {
								Monogatari.next ();
							}
							break;

						case 'display':

							if (parts[1] == 'message') {
								if (typeof messages == 'object') {
									const mess = messages[parts[2]];
									$_('[data-ui="message-content"]').html('<h3>' + mess.Title + '</h3><p>' + mess.Subtitle + '</p>' + '<p>' + mess.Message + '</p>');
									$_('[data-ui="messages"]').addClass('active');
								}
							} else if (parts[1] == 'image') {
								if (typeof parts[3] === 'undefined') {
									parts[3] = 'center';
								}
								if (parts[3] == 'with') {
									parts[3] = 'center';
									parts[5] = parts[4];
								}
								if (typeof Monogatari.assets ('images', parts[2]) !== 'undefined') {
									$_('#game').append('<img src="img/' + Monogatari.assets ('images', parts[2]) + '" class="animated ' + parts[5] + ' ' + parts[3] + '" data-image="' + parts[2] + '">');
									Monogatari.setting ('ImageHistory').push('<img src="img/' + Monogatari.assets ('images', parts[2]) + '" class="animated ' + parts[5] + ' ' + parts[3] + '" data-image="' + parts[2] + '">');
								} else {
									$_('#game').append('<img src="img/' + parts[2] + '" class="animated ' + parts[5] + ' ' + parts[3] + '" data-image="' + parts[2] + '">');
									Monogatari.setting ('ImageHistory').push('<img src="img/' + parts[2] + '" class="animated ' + parts[5] + ' ' + parts[3] + '" data-image="' + parts[2] + '">');
								}

							}
							break;

						case 'end':
							Monogatari.endGame();
							break;

						case 'next':
							Monogatari.next();
							break;

						case 'clear':
							Monogatari.whipeText();
							if (advance) {
								Monogatari.next ();
							}
							break;

						case 'centered':
							$_('[data-ui="text"]').hide();
							$_('#game').append('<div class="middle align-center" data-ui="centered"></div>');
							if (Monogatari.setting ('TypeAnimation')) {
								if (Monogatari.setting ('CenteredTypeAnimation')) {
									globals.typedConfiguration.strings = [statement.replace(parts[0] + ' ', '')];
									globals.textObject = new Typed ('[data-ui="centered"]', globals.typedConfiguration);
								} else {
									$_('[data-ui="centered"]').html (statement.replace(parts[0] + ' ', ''));
								}
							} else {
								$_('[data-ui="centered"]').html (statement.replace(parts[0] + ' ', ''));
							}
							break;

						case 'vibrate':
							if (navigator) {
								if (navigator.vibrate) {
									navigator.vibrate(0);
									if (parts.length > 2) {
										navigator.vibrate(parts.slice(1, parts.length));
									} else {
										navigator.vibrate(parts[1]);
									}
								}
							}
							if (advance) {
								Monogatari.next ();
							}
							break;

						case 'notify':
							if (typeof notifications == 'object') {
								if (notifications[parts[1]] && ('Notification' in window)) {
									// Let's check whether notification permissions have already been granted
									if (Notification.permission === 'granted') {
										// If it's okay let's create a notification
										const notification = new Notification(notifications[parts[1]].title, notifications[parts[1]]);

										if (parts[2]) {
											setTimeout(function () {
												notification.close();
											}, parseInt(parts[2]));
										}

									} else if (Notification.permission !== 'denied') {
										Notification.requestPermission(function (permission) {
											// If the user accepts, let's create a notification
											if (permission === 'granted') {
												const notification = new Notification(notifications[parts[1]].title, notifications[parts[1]]);
												if (parts[2]) {
													setTimeout(function () {
														notification.close();
													}, parseInt(parts[2]));
												}
											}
										});
									}
								}
							} else {
								console.error('The notifications object is not defined.');
							}
							if (advance) {
								Monogatari.next ();
							}
							break;

						case 'particles':
							if (typeof particles == 'object') {
								if (particles[parts[1]]) {
									if (typeof particlesJS != 'undefined') {
										particlesJS(particles[parts[1]]);
										if (typeof Monogatari.setting ('ParticlesHistory') !== 'object') {
											Monogatari.setting ('ParticlesHistory', []);
										}
										Monogatari.setting ('ParticlesHistory').push (parts[1]);
										Monogatari.setting ('Particles', parts[1]);
										if (advance) {
											Monogatari.next ();
										}
									} else {
										console.error('particlesJS is not loaded, are you sure you added it?');
									}
								} else {
									console.error('There is no definition of the "' + parts[1] + '" particle configuration.');
								}
							} else {
								console.error('The particles object is not defined.');
							}
							break;

						default:
							// Default case, used to show the dialog.
							var character = parts[0].split(':');
							var directory;

							// Remove focus from Monogatari.previous character.
							$_('[data-character]').removeClass('focus');

							// The character length condition checks if the split from above (:) contains two elements.
							// If there are two elements, then it's probable that it is a character identifier and
							// a face expression to be shown.

							// The typeof check, is to see if the character actually exists, if it does not, then it is
							// treated as a normal work and the narrator is used to show the dialog
							if (character.length > 1 && typeof Monogatari.character (character[0]) !== 'undefined') {
								if (typeof Monogatari.character (character[0]).Name !== 'undefined') {
									$_('[data-ui="who"]').html(Monogatari.replaceVariables(Monogatari.character (character[0]).Name));
								} else {
									document.querySelector('[data-ui="who"]').innerHTML = '';
								}
								$_('[data-character="' + character[0] + '"]').addClass('focus');
								$_('[data-ui="who"]').style('color', Monogatari.character (character[0]).Color);

								// Check if the character object defines if the type animation should be used.
								if (typeof Monogatari.character (character[0]).TypeAnimation !== 'undefined') {
									if (Monogatari.character (character[0]).TypeAnimation === true) {
										Monogatari.displayDialog (statement.replace(parts[0] + ' ', ''), character[0], true);
									} else {
										Monogatari.displayDialog (statement.replace(parts[0] + ' ', ''), character[0], false);
									}
								} else {
									Monogatari.displayDialog (statement.replace(parts[0] + ' ', ''), character[0], true);
								}

								if (typeof Monogatari.character (character[0]).Side != 'undefined') {
									if (typeof Monogatari.character (character[0]).Side[character[1]] != 'undefined' && Monogatari.character (character[0]).Side[character[1]] != '') {
										directory = Monogatari.character (character[0]).Directory;
										if (typeof directory == 'undefined') {
											directory = '';
										} else {
											directory += '/';
										}
										$_('[data-ui="face"]').attribute('src', 'img/characters/' + directory + Monogatari.character (character[0]).Side[character[1]]);
										$_('[data-ui="face"]').show();
									} else {
										$_('[data-ui="face"]').hide();
									}
								} else {
									$_('[data-ui="face"]').hide();
								}
							} else if (typeof Monogatari.character (parts[0]) != 'undefined') {
								if (typeof Monogatari.character (character[0]).Name !== 'undefined') {
									$_('[data-ui="who"]').html(Monogatari.replaceVariables(Monogatari.character (character[0]).Name));
								} else {
									document.querySelector('[data-ui="who"]').innerHTML = '';
								}
								$_('[data-character="' + parts[0] + '"]').addClass('focus');
								$_('[data-ui="who"]').style('color', Monogatari.character (parts[0]).Color);

								// Check if the character object defines if the type animation should be used.
								if (typeof Monogatari.character (character[0]).TypeAnimation !== 'undefined') {
									if (Monogatari.character (character[0]).TypeAnimation === true) {
										Monogatari.displayDialog (statement.replace(parts[0] + ' ', ''), character[0], true);
									} else {
										Monogatari.displayDialog (statement.replace(parts[0] + ' ', ''), character[0], false);
									}
								} else {
									Monogatari.displayDialog (statement.replace(parts[0] + ' ', ''), character[0], true);
								}

								if (typeof Monogatari.character (parts[0]).Face != 'undefined' && Monogatari.character (parts[0]).Face != '') {
									directory = Monogatari.character (parts[0]).Directory;
									if (typeof directory == 'undefined') {
										directory = '';
									} else {
										directory += '/';
									}
									$_('[data-ui="face"]').attribute('src', 'img/characters/' + directory + Monogatari.character (parts[0]).Face);
									$_('[data-ui="face"]').show();
								} else {
									$_('[data-ui="face"]').hide();
								}
							} else {
								// The narrator is speaking
								$_('[data-ui="face"]').hide();
								document.querySelector('[data-ui="who"]').innerHTML = '';

								if (typeof Monogatari.setting ('NarratorTypeAnimation') !== 'undefined') {
									if (Monogatari.setting ('NarratorTypeAnimation') === true) {
										Monogatari.displayDialog (statement, 'narrator', true);
									} else {
										Monogatari.displayDialog (statement, 'narrator', false);
									}
								} else {
									Monogatari.displayDialog (statement, 'narrator', true);
								}
							}
							break;
					}
					break;

				case 'function':
					Monogatari.assertAsync(statement, Monogatari).then(function () {
						globals.block = false;
						if (advance) {
							Monogatari.next ();
						}
					}).catch(function () {
						globals.block = false;
					});
					break;

				case 'object':
					if (typeof statement.Choice != 'undefined') {
						$_('[data-ui="choices"]').html('');
						for (const i in statement.Choice) {
							const choice = statement.Choice[i];
							if (typeof choice.Condition != 'undefined' && choice.Condition != '') {

								Monogatari.assertAsync(statement.Choice[i].Condition, Monogatari).then(function () {
									if (typeof choice.Class != 'undefined') {
										$_('[data-ui="choices"]').append('<button data-do="' + choice.Do + '" class="' + choice.Class + '">' + choice.Text + '</button>');
									} else {
										$_('[data-ui="choices"]').append('<button data-do="' + choice.Do + '">' + choice.Text + '</button>');
									}
									globals.block = false;
								}).catch(function () {
									globals.block = false;
								});
							} else {
								if (typeof choice == 'object') {
									if (typeof choice.Class != 'undefined') {
										$_('[data-ui="choices"]').append('<button data-do="' + choice.Do + '" class="' + choice.Class + '">' + choice.Text + '</button>');
									} else {
										$_('[data-ui="choices"]').append('<button data-do="' + choice.Do + '">' + choice.Text + '</button>');
									}
								} else if (typeof choice == 'string') {
									Monogatari.run(choice, false);
								}
							}
							$_('[data-ui="choices"]').show ('flex');
						}
					} else if (typeof statement.Conditional != 'undefined') {
						const condition = statement.Conditional;
						Monogatari.assertAsync(condition.Condition, Monogatari).then(function () {
							Monogatari.run(condition.True, false);
							globals.block = false;
						}).catch(function () {
							Monogatari.run(condition.False, false);
							globals.block = false;
						});

					} else if (typeof statement.Input != 'undefined') {
						$_('[data-ui="input"] [data-ui="input-message"]').text(statement.Input.Text);
						$_('[data-ui="input"]').addClass('active');

						function inputButtonListener (event) {
							event.stopPropagation ();
							event.preventDefault ();
							const inputValue = $_('[data-ui="input"] input').value();

							Monogatari.assertAsync(statement.Input.Validation, Monogatari, [inputValue]).then(function () {
								Monogatari.assertAsync(statement.Input.Save, Monogatari, [inputValue]).then(function () {
									$_('[data-ui="input"]').removeClass('active');
									$_('[data-ui="input"] [data-ui="warning"]').text('');
									$_('[data-ui="input"] input').value('');
									$_('[data-ui="input"] [data-action="submit"]').get(0).removeEventListener('click', inputButtonListener);
									Monogatari.next ();
									globals.block = false;
								}).catch(function () {
									$_('[data-ui="input"]').removeClass('active');
									$_('[data-ui="input"] [data-ui="warning"]').text('');
									$_('[data-ui="input"] input').value('');
									$_('[data-ui="input"] [data-action="submit"]').get(0).removeEventListener('click', inputButtonListener);
									globals.block = false;
								});
							}).catch(function () {
								$_('[data-ui="input"] [data-ui="warning"]').text(statement.Input.Warning);
								globals.block = false;
							});
						}

						$_('[data-ui="input"] [data-action="submit"]').click(inputButtonListener);
					} else if (typeof statement.Function !== 'undefined') {
						Monogatari.assertAsync(statement.Function.Apply, Monogatari).then(function () {
							globals.block = false;
							if (advance) {
								Monogatari.next ();
							}
						}).catch(function () {
							globals.block = false;
						});
					} else if (typeof statement.$ !== 'undefined') {
						const fn = Monogatari.fn (statement.$.name);
						if (typeof fn  !== 'undefined') {
							if (typeof fn.apply  !== 'undefined') {
								Monogatari.assertAsync (fn.apply, Monogatari).then (function () {
									globals.block = false;
									if (advance) {
										Monogatari.next ();
									}
								}).catch(function () {
									globals.block = false;
								});
							}
						}
					}
					break;
			}
		} catch (e) {
			console.error('An error ocurred while while trying to analyse the following statement: ' + statement + '\n' + e);
			Monogatari.next();
		}
	}



	/////////////////

	static setup () {
		// Set the initial settings if they don't exist or load them.
		Storage.get ('Settings').then ((local_settings) => {
			Monogatari._preferences = Object.assign ({}, Monogatari._preferences, local_settings);
		}).catch (() => {
			Storage.set ('Settings', Monogatari._preferences);
		});

		if (typeof Typed === 'undefined') {
			console.error ('Typed library not found, dialogs will not be shown.');
		}

		// Set the startLabel property, which will be used when the game is reset.
		Monogatari.setting ('startLabel', Monogatari.setting ('Label'));

		// Register service worker
		if (Monogatari.setting ('ServiceWorkers')) {
			if (!Platform.electron () && !Platform.cordova () && Platform.serviceWorkers ()) {
				navigator.serviceWorker.register ('./../service-worker.js');
			} else {
				console.warn ('Service Workers are not available in this browser or have been disabled in the engine configuration. Service Workers are available only when serving your files through a server, once you upload your game this warning will go away. You can also try using a simple server like this one for development: https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb/');
			}
		}

		globals.storageStructure = JSON.stringify(Monogatari.storage ());
	}

	/**
	 * Every event listener should be binded in this function.
	 */
	static bind () {
		// Fix for select labels
		$_('[data-select]').click (function () {
			const e = document.createEvent ('MouseEvents');
			e.initMouseEvent ('mousedown');
			$_(`[data-action='${$_(this).data ('select')}']`).get (0). dispatchEvent (e);
		});

		// Bind Language select so that every time a language is selected, the
		// ui and game get correctly localized.
		$_('[data-action="set-language"]').change (function () {
			Monogatari.setting ('Language', $_(this).value ());
			Monogatari.localize ();
		});

		// Add the orientation checker in case that a specific orientation was
		// defined.
		if (Monogatari.setting ('Orientation') !== 'any' && Platform.mobile ()) {

			// Set the event listener for device orientation so we can display a message
			window.addEventListener ('orientationchange', () => {
				if (Platform.orientation () !== Monogatari.setting ('Orientation')) {
					$_('[data-notice="orientation"]').addClass ('modal--active');
				} else {
					$_('[data-notice="orientation"]').removeClass ('modal--active');
				}
			}, false);
		}

		// Add event listener for back buttons. If the player is plaing, the back
		// button will return to the game, if its not playing, then it'll return
		// to the main menu.
		$_('[data-menu]').on ('click', '[data-action="back"]:not(#game)', (event) => {
			event.stopPropagation ();
			$_('section').hide ();
			if (globals.playing) {
				$_('#game').show ();
			} else {
				$_('[data-menu="main"]').show ();
			}
		});

		// Save to slot when a slot is pressed.
		$_('[data-menu="save"]').on ('click', 'figcaption, img, small', function () {
			globals.overwriteSlot = $_(this).parent ().data ('save');
			Storage.get (Monogatari.setting ('SaveLabel') + globals.overwriteSlot).then ((data) => {
				if (typeof data.Name !== 'undefined') {
					$_('[data-notice="slot-overwrite"] input').value (data.Name);
				} else {
					$_('[data-notice="slot-overwrite"] input').value (data.Date);
				}
				$_('[data-notice="slot-overwrite"]').addClass ('modal--active');
			});
		});

		$_('[data-menu="save"], [data-menu="load"]').on ('click', '[data-delete]', function () {
			globals.deleteSlot = $_(this).data ('delete');
			Storage.get (Monogatari.setting ('SaveLabel') + globals.deleteSlot).then ((data) => {
				if (typeof data.Name !== 'undefined') {
					$_('[data-notice="slot-deletion"] small').text (data.Name);
				} else {
					$_('[data-notice="slot-deletion"] small').text (data.Date);
				}

				$_('[data-notice="slot-deletion"]').addClass ('modal--active');
			});
		});

		Monogatari.ambientPlayer = document.querySelector ('[data-component="ambient"]');
		Monogatari.musicPlayer = document.querySelector ('[data-component="music"]');
		Monogatari.soundPlayer = document.querySelector ('[data-component="sound"]');
		Monogatari.videoPlayer = document.querySelector ('[data-ui="player"]');
		Monogatari.voicePlayer = document.querySelector ('[data-component="voice"]');

		// Volume bars listeners
		$_('[data-action="set-volume"]').on ('change mouseover', function () {
			const v = document.querySelector (`[data-component='${$_(this).data('target')}']`);
			const value = $_(this).value();

			switch ($_(this).data('target')) {
				case 'music':
					Monogatari.ambientPlayer.volume = value;
					v.volume = value;
					Monogatari.preference ('Volume').Music = value;
					break;

				case 'voice':
					v.volume = value;
					Monogatari.preference ('Volume').Voice = value;
					break;

				case 'sound':
					v.volume = value;
					Monogatari.preference ('Volume').Sound = value;
					break;
			}
			Storage.set ('Settings', Monogatari.preferences ());
		});

		$_('[data-action="set-text-speed"]').on ('change mouseover', function () {
			const value =  Monogatari.setting ('maxTextSpeed') - parseInt($_(this).value());
			globals.typedConfiguration.typeSpeed = value;
			Monogatari.preference ('TextSpeed', value);
		});

		$_('[data-action="set-auto-play-speed"]').on ('change mouseover', function () {
			const value = Monogatari.setting ('maxAutoPlaySpeed') - parseInt($_(this).value());
			Monogatari.preference ('AutoPlaySpeed', value);
		});

		// Language select listener
		$_('[data-action="set-language"]').change (() => {
			globals.game =  Monogatari.script (Monogatari.preference ('Language'));
			globals.label = globals.game[Monogatari.setting ('Label')];
		});

		$_('#game [data-ui="quick-menu"], #game [data-ui="quick-menu"] *').click ((event) => {
			// Clicked Child
			event.stopPropagation ();
		});

		$_('body').on('click', '[data-do]', function () {
			Monogatari.hideCentered ();
			Monogatari.shutUp ();
			if ($_(this).data('do') != 'null' && $_(this).data('do') != '') {
				try {
					$_('[data-ui="choices"]').hide ();
					$_('[data-ui="choices"]').html ('');
					Monogatari.run ($_(this).data ('do'), false);
				} catch (e) {
					console.error('An error ocurred while trying to execute the choice\'s action.\n' + e);
				}
			}
		});

		$_('#game').click(function () {
			if (Monogatari.canProceed()) {
				if (!globals.finishedTyping && globals.textObject !== null) {
					const str = globals.textObject.strings [0];
					const element = $_(globals.textObject.el).data ('ui');
					globals.textObject.destroy ();
					if (element == 'centered') {
						$_('[data-ui="centered"]').html (str);
					} else {
						$_('[data-ui="say"]').html (str);
					}
					globals.finishedTyping = true;
				} else {
					Monogatari.hideCentered ();
					Monogatari.shutUp();
					Monogatari.next ();
				}
			}
		});

		$_('[data-action]').click(function (event) {

			switch ($_(this).data('action')) {

				case 'open-menu':
					$_('section').hide();

					if ($_(this).data('open') == 'save') {
						$_('[data-menu="save"] [data-input="slotName"]').value (Monogatari.niceDateTime ());
					}

					$_('[data-menu="' + $_(this).data('open') + '"]').show();

					break;

				case 'pause':
					break;

				case 'start':
					Monogatari.stopAmbient();
					globals.playing = true;
					$_('section').hide();
					$_('#game').show();
					Monogatari.run(globals.label[Monogatari.setting ('Step')]);
					break;

				case 'close':
					$_('[data-ui="' + $_(this).data('close') + '"]').removeClass('active');
					break;

				case 'close-video':
					Monogatari.stopVideo();
					break;

				case 'quit':
					$_('[data-notice="exit"]').removeClass('modal--active');
					Monogatari.endGame();
					break;

				case 'dismiss-notice':
					$_('[data-notice]').removeClass('modal--active');
					break;

				case 'end':
					$_('[data-notice="exit"]').addClass('modal--active');
					break;

				case 'distraction-free':
					if ($_(this).hasClass('fa-eye')) {
						$_(this).removeClass('fa-eye');
						$_(this).addClass('fa-eye-slash');
						$_(this).parent ().find ('[data-string]').text (Monogatari.string ('Show'));
						$_('[data-ui="quick-menu"]').addClass ('transparent');
						$_('[data-ui="text"]').hide();
					} else if ($_(this).hasClass('fa-eye-slash')) {
						$_(this).removeClass('fa-eye-slash');
						$_(this).addClass('fa-eye');
						$_(this).parent ().find ('[data-string]').text (Monogatari.string ('Hide'));
						$_('[data-ui="quick-menu"]').removeClass ('transparent');
						$_('[data-ui="text"]').show();
					} else if ($_(this).text () === Monogatari.string ('Show')) {
						$_(this).text (Monogatari.string('Hide'));
						$_(this).parent ().find ('.fas').removeClass ('fa-eye-slash');
						$_(this).parent ().find ('.fas').addClass ('fa-eye');
						$_('[data-ui="quick-menu"]').removeClass ('transparent');
						$_('[data-ui="text"]').show ();
					} else if ($_(this).text () === Monogatari.string ('Hide')) {
						$_(this).text (Monogatari.string ('Show'));
						$_(this).parent ().find ('.fas').removeClass ('fa-eye');
						$_(this).parent ().find ('.fas').addClass ('fa-eye-slash');
						$_('[data-ui="quick-menu"]').addClass ('transparent');
						$_('[data-ui="text"]').hide ();
					}
					break;

				case 'auto-play':
					if ($_(this).hasClass('fa-play-circle')) {
						$_(this).removeClass('fa-play-circle');
						$_(this).addClass('fa-stop-circle');
						globals.autoPlay = setTimeout (function () {
							if (Monogatari.canProceed() && globals.finishedTyping) {
								Monogatari.hideCentered();
								Monogatari.shutUp();
								Monogatari.next ();
							}
						}, Monogatari.preference ('AutoPlaySpeed') * 1000);
					} else if ($_(this).hasClass('fa-stop-circle')) {
						$_(this).removeClass('fa-stop-circle');
						$_(this).addClass('fa-play-circle');
						clearTimeout (globals.autoPlay);
						globals.autoPlay = null;
					} else if ($_(this).text () === Monogatari.string ('AutoPlay')) {
						$_(this).text (Monogatari.string('Stop'));
						globals.autoPlay = setTimeout(function () {
							if (Monogatari.canProceed() && globals.finishedTyping) {
								Monogatari.hideCentered();
								Monogatari.shutUp();
								Monogatari.next ();
							}
						}, Monogatari.preference ('AutoPlaySpeed') * 1000);
					} else if ($_(this).text () === Monogatari.string ('Stop')) {
						$_(this).text (Monogatari.string ('AutoPlay'));
						clearTimeout (globals.autoPlay);
						globals.autoPlay = null;
					}
					break;

				case 'jump':
					Monogatari.stopAmbient();
					globals.label = globals.game[$_(this).data('jump')];
					Monogatari.setting ('Step', 0);
					globals.playing = true;
					$_('section').hide();
					$_('#game').show();
					Monogatari.run(globals.label[Monogatari.setting ('Step')]);
					break;

				case 'save':
					var slotName = $_('[data-menu="save"] [data-input="slotName"]').value ().trim ();
					if (slotName !== '') {
						Monogatari.newSave (slotName);
					}
					break;

				case 'delete-slot':
					Storage.remove (Monogatari.setting ('SaveLabel') + globals.deleteSlot);
					$_(`[data-load-slot="${globals.deleteSlot}"], [data-save="${globals.deleteSlot}"]`).remove ();
					globals.deleteSlot = null;
					$_('[data-notice="slot-deletion"]').removeClass ('modal--active');
					break;

				case 'overwrite-slot':
					var customName = $_('[data-notice="slot-overwrite"] input').value ().trim ();
					if (customName !== '') {
						Monogatari.saveToSlot (globals.overwriteSlot, Monogatari.setting ('SaveLabel') + globals.overwriteSlot, customName);
						globals.overwriteSlot = null;
						$_('[data-notice="slot-overwrite"]').removeClass ('modal--active');
					}
					break;
			}
			return false;
		});

		$_('#game [data-action="back"], #game [data-action="back"] *').click(function (event) {
			event.stopPropagation ();
			if (Monogatari.canProceed ()) {
				Monogatari.previous ();
			}
		});

		/**
		 * ==========================
		 * In-Game Event Handlers
		 * ==========================
		 **/

		$_(document).keyup(function (e) {
			if (e.target.tagName.toLowerCase() != 'input') {
				switch (e.which) {

					// Escape Key
					case 27:
						if ($_('#game').isVisible()) {
							$_('#game').hide();
							$_('[data-menu="settings"]').show();
						}
						break;

					// Spacebar and Right Arrow
					case 32:
					case 39:
						if (Monogatari.canProceed()) {
							if (!globals.finishedTyping && globals.textObject !== null) {
								const str = globals.textObject.strings [0];
								const element = $_(globals.textObject.el).data ('ui');
								globals.textObject.destroy ();
								if (element == 'centered') {
									$_('[data-ui="centered"]').html (str);
								} else {
									$_('[data-ui="say"]').html (str);
								}
								globals.finishedTyping = true;
							} else {
								Monogatari.hideCentered();
								Monogatari.shutUp();
								Monogatari.next ();
							}
						}
						break;

					// Left Arrow
					case 37:
						Monogatari.previous();
						break;

					// H Key
					case 72:
						event.stopPropagation();
						if ($_('[data-action="distraction-free"]').hasClass('fa-eye')) {
							$_('[data-action="distraction-free"]').removeClass('fa-eye');
							$_('[data-action="distraction-free"]').addClass('fa-eye-slash');
							$_('[data-ui="text"]').hide();
						} else if ($_('[data-action="distraction-free"]').hasClass('fa-eye-slash')) {
							$_('[data-action="distraction-free"]').removeClass('fa-eye-slash');
							$_('[data-action="distraction-free"]').addClass('fa-eye');
							$_('[data-ui="text"]').show();
						}
						break;

					// Exit this handler for other keys to run normally
					default:
						return;
				}
			}

			e.preventDefault();
		});

		// Load a saved game slot when it is pressed
		$_('[data-menu="load"] [data-ui="saveSlots"]').on ('click', 'figcaption, img', function () {
			Monogatari.loadFromSlot (Monogatari.setting ('SaveLabel') + $_(this).parent().data('loadSlot'));
		});

		// Load an autosaved game slot when it is pressed
		$_('[data-menu="load"] [data-ui="autoSaveSlots"]').on ('click', 'figcaption, img', function () {
			Monogatari.loadFromSlot (Monogatari.setting ('AutoSaveLabel') + $_(this).parent().data('loadSlot'));
		});
	}

	static init () {

		Monogatari.setup ();
		Monogatari.bind ();

		// Set the initial language translations
		Monogatari.localize ();

		// Set the game language or hide the option if the game is not multilingual
		if (Monogatari.setting ('MultiLanguage')) {
			globals.game = Monogatari.script (Monogatari.preference ('Language'));
			$_('[data-action="set-language"]').value (Monogatari.preference ('Language'));
			Monogatari.localize ();
		} else {
			globals.game = Monogatari.script ();
			$_('[data-settings="language"]').hide ();
		}

		// Set the label in which the game will start
		globals.label = globals.game[Monogatari.setting ('Label')];

		// Check if the orientation is correct, if it's not, show the warning
		// message so the player will rotate its device.
		if (Platform.mobile () && Platform.orientation () !== Monogatari.setting ('Orientation')) {
			$_('[data-notice="orientation"]').addClass ('modal--active');
		}

		// Set all the dynamic backgrounds of the data-background property
		$_('[data-background]').each ((element) => {
			const background = $_(element).data ('background');
			if (background.indexOf ('.') > -1) {
				$_(element).style ('background', `url('${background}') center / cover no-repeat`);
			} else {
				$_(element).style ('background', background);
			}
		});

		// Disable audio settings in iOS since they are not supported
		if (Platform.mobile ('iOS')) {
			// iOS handles the volume using the system volume, therefore there is now way to
			// handle each of the sound sources individually and as such, this is disabled.
			$_('[data-settings="audio"]').html (`<p>${Monogatari.string ('iOSAudioWarning')}</p>`);
		}

		// Disable the load and save slots in case Local Storage is not supported.
		if (!window.localStorage) {
			$_('[data-ui="slots"]').html (`<p>${Monogatari.string ('LocalStorageWarning')}</p>`);
		}

		Monogatari.electronSetup ();

		// Remove the Text Speed setting if the type animation was disabled
		if (Monogatari.setting ('TypeAnimation') === false) {
			$_('[data-settings="text-speed"]').hide ();
		}

		Monogatari.setting ('maxTextSpeed', parseInt ($_('[data-action="set-text-speed"]').property ('max')));
		Monogatari.setting ('maxAutoPlaySpeed', parseInt ($_('[data-action="set-auto-play-speed"]').property ('max')));

		// Set the volume of all the media components
		Monogatari.musicPlayer.volume = Monogatari.preference ('Volume').Music;
		Monogatari.ambientPlayer.volume = Monogatari.preference ('Volume').Music;
		Monogatari.voicePlayer.volume = Monogatari.preference ('Volume').Voice;
		Monogatari.soundPlayer.volume = Monogatari.preference ('Volume').Sound;
		document.querySelector ('[data-target="music"]').value = Monogatari.preference ('Volume').Music;
		document.querySelector ('[data-target="voice"]').value = Monogatari.preference ('Volume').Voice;
		document.querySelector ('[data-target="sound"]').value = Monogatari.preference ('Volume').Sound;

		document.querySelector('[data-action="set-text-speed"]').value = Monogatari.preference ('TextSpeed');
		document.querySelector('[data-action="set-auto-play-speed"]').value = Monogatari.preference ('AutoPlaySpeed');

		Monogatari.preload ().then(() => {
			$_('[data-menu="loading"]').fadeOut (400, () => {
				$_('[data-menu="loading"]').hide ();
			});
		}).catch ((e) => {
			console.error (e);
		}).finally (() => {
			Monogatari.showMainMenu ();
		});

		Monogatari.setSlots();

		if (Monogatari.setting ('AutoSave') != 0 && typeof Monogatari.setting ('AutoSave') === 'number') {
			setInterval(function () {
				Monogatari.autoSave (globals.currentAutoSaveSlot, Monogatari.setting ('AutoSaveLabel') + globals.currentAutoSaveSlot);

				if (globals.currentAutoSaveSlot === Monogatari.setting ('Slots')) {
					globals.currentAutoSaveSlot = 1;
				} else {
					globals.currentAutoSaveSlot += 1;
				}
				Monogatari.setAutoSlots ();

			}, Monogatari.setting ('AutoSave') * 60000);
		} else {
			$_('[data-menu="load"] [data-ui="autoSaveSlots"]').hide ();
		}

		// Play the main menu song
		Monogatari.playAmbient();
	}
}

Monogatari._actions = [];
Monogatari._components = [];
Monogatari._translations = {};
Monogatari._script = {};
Monogatari._characters = {};
Monogatari._storage = {};

Monogatari._globals = {

};

Monogatari._functions = {

};

Monogatari._status = {
	block: false,
	playing: false,
	finishedTyping: true
};

Monogatari._assets = {
	music: {},
	voice: {},
	sound: {},
	video: {},
	images: {},
	scenes: {}
};

Monogatari._settings = {

	// Initial Label *
	'Label': 'Start',

	// Number of AutoSave Slots
	'Slots': 10,

	// Current Media *
	'Song': '',
	'Sound': '',
	'Scene': '',
	'Particles': '',

	// Current Statement *.
	'Step': 0,

	// History for the Monogatari.previous function *.
	'MusicHistory': [],
	'SoundHistory': [],
	'ImageHistory': [],
	'CharacterHistory': [],
	'SceneHistory': [],
	'SceneElementsHistory': [],
	'ParticlesHistory': [],

	// Change to true for a MultiLanguage Game.
	'MultiLanguage': false,

	// Music for the Main Menu.
	'MenuMusic': '',

	// Prefix for the Save Slots in Local Storage.
	'SaveLabel': 'Save_',
	'AutoSaveLabel': 'AutoSave_',

	// Turn main menu on/off; Default: true *
	'ShowMenu': true,

	// Turn image preloading on/off, Default: true
	'Preload': true,

	// Time interval between autosaves (In Minutes). Default: 0 (Off)
	'AutoSave': 0,

	// Enable service workers; Default: true *
	'ServiceWorkers': true,

	// The Aspect Ratio your background images are on. This has no effect on
	// web deployed novels.
	'AspectRatio': '16:9',

	// Enables or disables the typing text animation for the whole game.
	'TypeAnimation': true,

	// Enables or disables the typing animation for the narrator.
	// If the Monogatari.previous property was set to false, the narrator won't shown
	// the animation even if this is set to true.
	'NarratorTypeAnimation': true,

	// Enables or disables the typing animation for the special centered
	// character. If the TypeAnimation property was set to false, the centered
	// character won't shown the animation even if this is set to true.
	'CenteredTypeAnimation': true,

	// Force some orientation on mobile devices. If this setting is set either
	// to portrait or landscape, a warning message will be displayed so the
	// player rotates its device.
	// Possible values: any, portrait or landscape.
	'Orientation': 'any'
};

Monogatari._preferences = {

	// Initial Language for Multilanguage Games or for the Default GUI Language.
	'Language': 'English',

	// Initial Volumes from 0.0 to 1.
	'Volume': {
		'Music': 1,
		'Voice': 1,
		'Sound': 1
	},

	// Initial resolution used for Electron, it must match the settings inside
	// the electron.js file. This has no effect on web deployed novels.
	'Resolution': '800x600',

	// Speed at which dialog text will appear
	'TextSpeed': 20,

	// Speed at which the Auto Play feature will show the next statement
	// It is measured in seconds and starts counting after the text is
	// completely displayed.
	'AutoPlaySpeed': 5
};

const globals = {
	label: '',
	game: {},
	textObject: null,
	autoPlay: null,
	deleteSlot: null,
	overwriteSlot: null,
	block: false,
	playing: false,
	finishedTyping: true,
	currentAutoSaveSlot: 1,
	typedConfiguration: {
		strings: [],
		typeSpeed: Monogatari.preference ('TextSpeed'),
		fadeOut: true,
		loop: false,
		showCursor: false,
		contentType: 'html',
		preStringTyped: function () {
			globals.finishedTyping = false;
		},
		onStringTyped: function () {
			if (globals.autoPlay !== null) {
				globals.autoPlay = setTimeout (function () {
					if (Monogatari.canProceed() && globals.finishedTyping) {
						Monogatari.hideCentered();
						Monogatari.shutUp ();
						Monogatari.next ();
					}
				}, Monogatari.preference ('AutoPlaySpeed') * 1000);
			}

			globals.finishedTyping = true;
		},
		onDestroy () {
			globals.finishedTyping = true;
		}
	}
};


$_ready(() => {
	Monogatari.init ();
});