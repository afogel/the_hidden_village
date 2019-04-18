import ScreenComponent from './../../lib/ScreenComponent';
import { Monogatari } from './../../monogatari';

class LoadingScreen extends ScreenComponent {

	constructor () {
		super ();

		this.state = {
			progress: 0
		};
	}

	didMount () {
		this.engine.on ('willPreloadAssets', () => {
			this.setState ({
				open: true
			});
		});

		this.engine.on ('didPreloadAssets', () => {
			this.setState ({
				open: false
			});
		});

		this.engine.on ('asset-loaded', (event) => {
			const progress = this.state.progress;
			this.setState ({
				progress: progress + 1
			});

		});
		return Promise.resolve ();
	}

	onStateUpdate (property, oldValue, newValue) {
		super.onStateUpdate (property, oldValue, newValue);
		if (property === 'progress') {
			this.content ('progress').attribute ('max', newValue);
			this.content ('progress').value (newValue);
		}
		return Promise.resolve ();
	}

	render () {
		return `
			<div data-content="wrapper">
				<h2 data-string="Loading" data-content="title">Loading</h2>
				<progress value="0" max="100" data-content="progress"></progress>
				<small data-string="LoadingMessage" data-content="message">Wait while the assets are loaded.</small>
			</div>
		`;
	}
}

LoadingScreen._id = 'loading-screen';

Monogatari.registerComponent (LoadingScreen);