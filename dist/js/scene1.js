// Define the Characters
monogatari.characters ({
	'elder': {
		name: 'Elder',
		color: '#5bcaff',
		sprites: {
			elder: 'Elder_01.png',
		}
	}
});
const first_scene =
monogatari.script ({
	// The game starts here.
	'Start': [
		'show scene #f7f6f6 with fadeIn',
		'show background url("assets/scenes/new_hotness2.png")',
		'play music MainMusic.mp3 with loop',
		'show canvas wireframe',
		'centered',
	// 	`Stars zoom past your ship as you make your way through space. Navigating
	// the stars is difficult, but you are an experienced pilot.Suddenly, alarm
	// bells begin to clang throughout the cabin.Something begins pulling your ship
	// off course! You jump to your feet to rush to the controls, but you are thrown
	// to the floor and your vision goes black.`,
	// 	'show character elder elder',
	// 	'hide character elder',
	// 	'show scene #f7f6f6 with fadeIn',
	// 	'show background url("assets/scenes/SnowyForest_a_02.png")',
	// 	`When you regain consciousness, your eyes open to see an alien planet. You have
  // been thrown from your ship and find yourself laying in the snow. You sit up and
  // look around. Your ship lies nearby at the edge of a dense forest. The fuel cell
  // that powers the ship has dislodged from the ship and sits empty of power in the snow.
  // As the cold wind begins to prickle at your skin, you hear a sound from deep amidst
  // the wintry trees. Hopeful for some help, you head towards the source of the sound.`,
	// 	'show scene #f7f6f6 with fadeIn',
	// 	'show background url("assets/scenes/SnowyForest_b_02.png")',
	// 	'show character elder elder',
	// 	`As you continue walking, the sound grows louder.  Stumbling through the dense
  // forest, you notice a golden light illuminating a path through the forest. You
  // follow the shimmering light until you reach clearing, and notice a strange being
  // is standing in the open.  She speaks to you in an unfamiliar language, but fortunately,
  // the translation device in your helmet translates her words.`,
	// 	'elder You crashed here?',
	// 	"You nod.",
	// 	"elder Let us help you.",
	// 	'show background url("assets/scenes/VillageEdge_a_02.png")',
	// 	"elder Follow me.",
	// 	"She leads you back through the forest to a small village with strange, dome- shaped buildings.",
	// 	`elder The people of this village can harness strings of energy that can recharge your ship’s
	// 	fuel cell. Meet with them and they can help you get home.`,
	// 	"You nod, and head further into the hidden village.",
	// 	'hide character elder',
	// 	'show character twins',
	],

	'Yes': [
		'y Thats awesome!',
		'y Then you are ready to go ahead and create an amazing Game!',
		'y I can’t wait to see what story you’ll tell!',
		'end'
	],

	'No': [

		'y You can do it now.',

		'show message Help',

		'y Go ahead and create an amazing Game!',
		'y I can’t wait to see what story you’ll tell!',
		'end'
	]
});
