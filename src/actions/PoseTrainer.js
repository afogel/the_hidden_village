import { $_ } from '@aegis-framework/artemis';
import { Action } from '../lib/Action';

export class PoseTrainer extends Action {

  static onLoad() {
    if (this.engine.state('poseTrainer').length > 0) {
      const promises = [];
      // return to the state of the poseTrainer
      for (const poseTrainer of this.engine.state('poseTrainer')) {
        const action = this.engine.prepareAction(poseTrainer, { cycle: 'Application' });
        const promise = action.willApply().then(() => {
          return action.apply().then(() => {
            return action.didApply({ updateHistory: false, updateState: false });
          });
        });

        promises.push(promise);
      }

      if (promises.length > 0) {
        return Promise.all(promises);
      }
    }

    return Promise.resolve();
  }

  static setup() {
    this.engine.history('poseTrainer');
    this.engine.state({
      poseTrainer: []
    });
    return Promise.resolve();
  }

  // TODO: implement this
  static reset() {
    const promises = [];

    // Go through each canvas element being shown so it can be properly
    // stopped and then removed.
    // this.engine.element().find('[data-component="canvas-container"]').each((canvasContainer) => {
    //   const { object } = canvasContainer.props;

    //   promises.push(Util.callAsync(object.stop, this.engine, canvasContainer.layers, object.props, object.state, canvasContainer).then(() => {
    //     canvasContainer.remove();
    //   }));
    // });

    this.engine.history({
      poseTrainer: []
    });

    this.engine.state({
      poseTrainer: []
    });

    return Promise.all(promises);
  }

  static matchString([show, type]) {
    return show === 'show' && type === 'pose_trainer';
  }

  // TODO: implement this
  static bind() {
    // window.addEventListener('resize', () => {
      // this.engine.element().find('[data-component="canvas-container"][mode="background"], [data-component="canvas-container"][mode="immersive"]').each((canvasContainer) => {
      //   const { object } = canvasContainer.props;
      //   if (typeof object.resize === 'function') {
      //     Util.callAsync(object.resize, this.engine, canvasContainer.layers, object.props, object.state, canvasContainer);
      //   }
      // });
    // });
    return Promise.resolve();
  }

  /**
   * Creates an instance of a Canvas Action
   *
   * @param {string[]} parameters - List of parameters received from the script statement.
   * @param {string} parameters.action - In this case, action will always be 'poseTrainer'
   * @param {string} parameters.mode
   */
  constructor([show, poseTrainer, name, separator, ...classes]) {
    super();

    this.name = name;
    this.conjecture = this.engine.storage().conjectures.filter(
      (conjecture) => conjecture.displayId === this.name
    );

    if (typeof classes !== 'undefined') {
      this.classes = ['animated', ...classes.filter((c) => c !== 'with')];
    } else {
      this.classes = [];
    }
  }

  willApply() {
    // if (this.constructor._configuration.modes.indexOf(this.mode) === -1) {
    //   FancyError.show(
    //     `The canvas mode provided ("${this.mode}") is not valid.`,
    //     `Monogatari attempted to show a canvas object but the mode "${this.mode}" was not found in the canvas action configuration as a valid mode.`,
    //     {
    //       'Mode Provided': this.mode,
    //       'You may have meant one of these': this.constructor._configuration.modes,
    //       'Statement': `<code class='language=javascript'>"${this._statement}"</code>`,
    //       'Label': this.engine.state('label'),
    //       'Step': this.engine.state('step'),
    //       'Help': {
    //         '_': 'Check your statement and make sure there are no typos on the mode you provided.'
    //       }
    //     }
    //   );
    //   return Promise.reject('Invalid canvas mode provided.');
    // }

    // this.object = Canvas.objects(this.name);
    if (this.conjecture.length === 0) {
      // FancyError.show(
      //   `The conjecture with displayId of "${this.name}" was not found or is invalid`,
      //   `Monogatari attempted to retrieve an object named "${this.name}" but it didn't exist in the saved conjectures.`,
      //   {
      //     'Conjecture': this.name,
      //     'You may have meant': this.engine.storage().conjectures.map((c) => c.displayId),
      //     'Label': this.engine.state('label'),
      //     'Step': this.engine.state('step'),
      //     'Help': {
      //       '_': `
      //         Check the conjecture\'s displayId name is correct and that you have defined it previously.
      //         A canvas object is defined as follows:
      //       `,
      //       '_1': `
			// 				<pre>
			// 					<code class='language-javascript'>
			// 						monogatari.storage ({
      //               conjectures: [
      //                 {
      //                   id: 1,
      //                   displayId: 'aaa',
      //                   name: "Angle Angle Angle",
      //                   poseOne: {
      //                     results: {
      //                       leftHandLandmarks: [{ x: 0.7292803525924683, y: 0.39912840723991394  ..., { x: 0.7286646962165833, y: 0.2106991410255432 }],
      //                       rightHandLandmarks: [{ x: 0.5922070741653442, y: 0.4865525960922241 }, ..., { x: 0.669626772403717, y: 0.41053521633148193 }],
      //                       faceLandmarks: [{ x: 0.5694752335548401, y: 0.1751568615436554 }, ..., { x: 0.669626772403717, y: 0.41053521633148193 }],
      //                       poseLandmarks: [null, ..., { x: 0.48310595750808716, y: 1.76513671875, visibility: 0.00004400118632474914 }]
      //                     }
      //                   },
      //                   poseTwo: {
      //                     results: {
      //                       leftHandLandmarks: [{ x: 0.7292803525924683, y: 0.39912840723991394  ..., { x: 0.7286646962165833, y: 0.2106991410255432 }],
      //                       rightHandLandmarks: [{ x: 0.5922070741653442, y: 0.4865525960922241 }, ..., { x: 0.669626772403717, y: 0.41053521633148193 }],
      //                       faceLandmarks: [{ x: 0.5694752335548401, y: 0.1751568615436554 }, ..., { x: 0.669626772403717, y: 0.41053521633148193 }],
      //                       poseLandmarks: [null, ..., { x: 0.48310595750808716, y: 1.76513671875, visibility: 0.00004400118632474914 }]
      //                     }
      //                   }
      //                 }
      //               ]
      //             })
			// 					</code>
			// 				</pre>
			// 			`
      //     }
      //   }
      // );
      return Promise.reject('Canvas object did not exist or is invalid');
    }
    // if (typeof this.object !== 'object') {
    //   FancyError.show(
    //     `The canvas object "${this.name}" was not found or is invalid`,
    //     `Monogatari attempted to retrieve an object named "${this.name}" but it didn't exist in the canvas objects.`,
    //     {
    //       'Canvas': this.name,
    //       'You may have meant': Object.keys(Canvas.objects()),
    //       'Label': this.engine.state('label'),
    //       'Step': this.engine.state('step'),
    //       'Help': {
    //         '_': 'Check the object\'s name is correct and that you have defined it previously. A canvas object is defined as follows:',
    //         '_1': `
		// 					<pre>
		// 						<code class='language-javascript'>
		// 							this.engine.action ('Canvas').objects ({
		// 								stars: {
		// 									start: () => {},
		// 									stop: () => {},
		// 									restart: () => {},
		// 									layers: [],
		// 									state: {},
		// 									props: {}
		// 								}
		// 							});
		// 						</code>
		// 					</pre>
		// 				`,
    //         '_2': 'Notice the object defined uses a name or an id, in this case it was set to "stars" and to show it, you must use that exact name:',
    //         '_3': `
		// 					<pre><code class='language-javascript'>"show canvas stars background"</code></pre>
		// 				`
    //       }
    //     }
    //   );

    //   return Promise.reject('Canvas object did not exist or is invalid');
    // }
    this.element = document.createElement('pose-display');

    this.containerSelector = `[data-component="pose-display"][pose-display="${this.name}"][mode="${this.mode}"]`;

    return Promise.resolve();
  }

  apply() {
    const defaultFunction = () => Promise.resolve();
    this.element.setProps({
      desiredPose: {
        poseOne: this.conjecture[0].poseOne,
        poseTwo: this.conjecture[0].poseTwo
      },
      classes: [],
      comparisonPose: "PoseOne"
    });
    this.element.addEventListener('poseSwitch', (e) => {
      let poseToSwitch = this.element.props.comparisonPose === "PoseOne" ? "PoseTwo" : "PoseOne";
      this.element.setProps({
        comparisonPose: poseToSwitch
      });
    })

    const gameScreen = this.engine.element().find('[data-screen="game"]');
    gameScreen.find('[data-ui="background"]').append(this.element);

    return Promise.resolve();
  }

  didApply({ updateHistory = true, updateState = true } = {}) {
    if (updateHistory === true) {
      this.engine.history('canvas').push(this._statement);
    }

    if (updateState === true) {
      this.engine.state('canvas').push(this._statement);
    }

    if (this.mode === 'background' || this.mode === 'character' || this.mode === 'displayable') {
      return Promise.resolve({ advance: true });
    }

    return Promise.resolve({ advance: false });
  }

  willRevert() {
    this.engine.element().find('[data-character]').remove();
    this.engine.element().find('[data-image]').remove();
    return Promise.resolve();
  }

  revert() {
    return this.engine.revert(this._statement.replace('show scene', 'show background'), false, false).then(() => {
      // this.engine.history ('scene').pop ();
      const restoreSceneItems = () => {
        if (this.engine.history('sceneElements').length > 0) {
          const scene_elements = this.engine.history('sceneElements').pop();

          if (typeof scene_elements === 'object') {
            for (const element of scene_elements) {
              this.engine.element().find('[data-screen="game"]').append(element);
            }
          }
        }

        if (this.engine.history('sceneState').length > 0) {
          const scene_state = this.engine.history('sceneState').pop();

          if (typeof scene_state === 'object') {
            const state = { ...scene_state };
            const textBox = this.engine.element().find('[data-component="text-box"]').get(0);

            textBox.setProps({ mode: state.textBoxMode });

            if (state.textBoxMode === 'nvl') {
              this.engine.global('_should_restore_nvl', true);
            }

            delete state.textBoxMode;
            this.engine.state(scene_state);
          }
        }
      };

      // Check if the scene history still has elements left, if it doesn't then we need to roll back
      // to the initial background defined in the CSS and not in the script.
      if (this.engine.history('scene').length > 0) {
        this.engine.global('_scene_history_cleared_by_background', false);
        const last = this.engine.history('scene')[this.engine.history('scene').length - 1];

        this.engine.state({
          scene: last
        });

        this.engine.history('scene').pop();

        restoreSceneItems();
        return this.engine.action('Dialog').reset();
      }

      // If the scene history was empty, we just need to check if it was the background
      // action who cleared it. If that was the case, we still need to restore the other
      // items that we save for each scene apart from the background.
      if (this.engine.global('_scene_history_cleared_by_background') === true) {
        this.engine.global('_scene_history_cleared_by_background', false);
        restoreSceneItems();
        return this.engine.action('Dialog').reset();
      }
    });
  }

  didRevert() {
    return Promise.resolve({ advance: true, step: true });
  }
}

PoseTrainer.id = 'pose';

export default PoseTrainer;
