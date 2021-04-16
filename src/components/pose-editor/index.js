import { ScreenComponent } from '../../lib/ScreenComponent';
import { $_ } from '@aegis-framework/artemis';

class PoseEditor extends ScreenComponent {

  constructor() {
    super();

    this.props = {
      countdownId: null,
      counter: null,
      setPose: false,
      poseToSet: "PoseOne",
      poseDisplay: null
    };
  }

  static bind() {
    return Promise.resolve();
  }

  didMount() {
    let engine = this.engine;
    let props = this.props;
    let self = this;
    this.engine.on('click', '[data-action="edit-conjecture"]', (e) => {
      let conjectureId = parseInt(e.target.dataset.conjectureId);
      let conjecture = engine.storage().conjectures.filter(conjecture => conjecture.id === conjectureId)[0];
      $_('#conjecture-list').toggleClass('hidden');
      $_('[data-action="back"]').toggleClass('hidden top left');
      $_('#editor-actions').toggleClass('hidden');
      $_(`[data-action="save-poses"]`).attribute('data-conjecture-id', conjectureId)
      let display = document.createElement('pose-display')
      self.setProps({
        poseToSet: "PoseOne"
      })
      display.setProps({
        desiredPose: conjecture,
        counter: props.counter,
        setPose: props.setPose,
        countdownID: props.countdownID,
        poseToSet: props.poseToSet
      })
      $_('[data-component="display-container"]').append(display)
      self.setProps({
        poseDisplay: display
      })
    });

    // in order to get one directional state management, updating on the top-level
    // component and also on the child component
    // This is a hacky way to get one directional state management, but yolo
    this.engine.on('click', '[data-action="capture-pose"]', function (event) {
      let counter = 3
      let setPose = props.setPose
      let poseToSet = props.poseToSet
      let poseDisplay  = props.poseDisplay
      let countdownID = setInterval(() => {

        if (counter < 0) {
          clearInterval(countdownID);

          counter = null;
          setPose = true;
          countdownID = null;
          // These need to be set after the 0 is shown to the user
          setTimeout(() => {
            poseToSet = props.poseToSet === "PoseOne" ? "PoseTwo": "PoseOne" ;
            self.setProps({setPose: false, poseToSet: poseToSet})
            poseDisplay.setProps({ setPose: false, poseToSet: poseToSet})
            // clearInterval(cleanupCounter);
          }, 100)
        }
        self.setProps({
          counter: counter,
          countdownID: countdownID,
          setPose: setPose,
          poseToSet: poseToSet
        })
        poseDisplay.setProps({
          counter: counter,
          countdownID: countdownID,
          setPose: setPose,
          poseToSet: poseToSet
        })
        counter--;
      }, 1000);
    }, false);

    this.engine.on('click', '[data-action="save-poses"]', function (e) {
      let flash = $_('#save-message');
      flash.toggleClass('hidden')
      let conjectureId = parseInt(e.target.dataset.conjectureId);
      let newConjectures = engine.storage().conjectures.map(conjecture => {
        if (conjecture.id === conjectureId){
          conjecture.poseOne = self.props.poseDisplay.props.desiredPose.poseOne
          conjecture.poseTwo = self.props.poseDisplay.props.desiredPose.poseTwo
        }
        return conjecture
      })
      engine.storage().conjectures = newConjectures
      setTimeout(() => {
        flash.toggleClass('hidden')
      }, 800);
    }, false);

    this.engine.on('click', '[data-action="return-to-menu"]', function (e) {
      engine.component('pose-display').stop(document.getElementById('pose-display-canvas'));
      $_(`pose-display`).remove();
      $_('#conjecture-list').toggleClass('hidden');
      $_('[data-action="back"]').toggleClass('hidden top left');
      $_('#editor-actions').toggleClass('hidden');
      $_(`[data-action="save-poses"]`).attribute('data-conjecture-id', null)
    }, false);

    return Promise.resolve();
  }

  render() {
    return `
			<button class="top left" data-action="back"><span class="fas fa-arrow-left"></span></button>
      <div class="row">
        <h2 data-string="PoseEditor">Pose Editor</h2>
      </div>
      <div class="row hidden" id="editor-actions">
        <button data-action="capture-pose">Capture Pose</button>
        <button data-action="save-poses">Save Poses</button>
        <button data-action="return-to-menu">Return To Conjectures</button>
      </div>
      <div class="hidden row" id="save-message">
        <h2>Saving...</h2>
      </div>
      <table id="conjecture-list">
        <tr>
          <th class="text--center">Conjecture Name</th>
          <th class="text--center">Action</th>
        </tr>
        ${this.engine.storage().conjectures.map(conjecture => {
          return `
          <tr>
            <td class="text--left">${conjecture.name}</td>
            <td class="text--right"><button data-conjecture-id="${conjecture.id}" data-action="edit-conjecture">Edit</button></td>
          </tr>
          `
        }).join("")}
      </table>
      <div data-component="display-container"></div>
		`;
  }

}

PoseEditor.tag = 'pose-editor';


export default PoseEditor;
