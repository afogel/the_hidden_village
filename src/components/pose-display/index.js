import { Component } from '../../lib/Component';
import { DrawingArea, selectedPose, bodyTooClose, drawProximityWarning, colWiseAverage } from "../../lib/editor_utils.js";
import { Pose } from "../../lib/pose.js";

const RED = "#FF0000";
const SMOOTHING = false;

class PoseDisplay extends Component {

  constructor() {
    super();

    this.props = {
      desiredPose: {},
      classes: [],
      comparisonPose: undefined
    };

    this.recentPoses = [];
    this.recentFace = [];
    this.recentLeftHand = [];
    this.recentRightHand = [];
    this.recentPose = [];
  }

  paint(canvas) {
    const playerCanvas = new DrawingArea(canvas, 0.55, 0.725, 0.375, 0.125);
    const poseOneCanvas = new DrawingArea(canvas, 0.325, 0.325, 0.025, 0.125);
    const poseTwoCanvas = new DrawingArea(canvas, 0.325, 0.325, 0.025, 0.5);
    let context = canvas.getContext('2d');

    let poseOne;
    let poseTwo;

    if (Object.entries(this.props.desiredPose.poseOne).length !== 0) {
      poseOne = new Pose(this.props.desiredPose.poseOne.results);
      poseTwo = new Pose(this.props.desiredPose.poseTwo.results);
    } else {
      poseOne = null;
      poseTwo = null;
    }

    return (results) => {
      if (SMOOTHING) {
        // if (this.recentPoses.length < 10) {
          // this.recentPoses.push(results);

          // shift always if length >= 10
          // don't shift if length == 0
          // if valid, push to queue
          // if queue >= 1, draw
          if (this.recentRightHand.length >= 15) {
            this.recentRightHand.shift()
          }
          if (results.rightHandLandmarks) {
            this.recentRightHand.push(results.rightHandLandmarks);
          } else {
            this.recentRightHand.shift();
          }
          if (this.recentLeftHand.length >= 15) {
            this.recentLeftHand.shift()
          }
          if (results.leftHandLandmarks) {
            this.recentLeftHand.push(results.leftHandLandmarks);
          } else {
            this.recentLeftHand.shift();
          }
          if (this.recentPose.length >= 15) {
            this.recentPose.shift()
          }
          if (results.poseLandmarks) {
            this.recentPose.push(results.poseLandmarks);
          } else {
            this.recentPose.shift();
          }
          if (this.recentFace.length >= 15) {
            this.recentFace.shift()
          }
          if (results.faceLandmarks) {
            this.recentFace.push(results.faceLandmarks);
          } else {
            this.recentFace.shift();
          }
          this.currentPose = {
            poseLandmarks: colWiseAverage(this.recentPose),
            rightHandLandmarks: colWiseAverage(this.recentRightHand),
            leftHandLandmarks: colWiseAverage(this.recentLeftHand),
            faceLandmarks: colWiseAverage(this.recentFace)
          }
        // } else {
        //   this.currentPose = {
        //     poseLandmarks: colWiseAverage(this.recentPoses.map((pose) => pose.poseLandmarks)),
        //     rightHandLandmarks: colWiseAverage(this.recentPoses.map((pose) => pose.rightHandLandmarks)),
        //     leftHandLandmarks: colWiseAverage(this.recentPoses.map((pose) => pose.leftHandLandmarks)),
        //     faceLandmarks: colWiseAverage(this.recentPoses.map(pose => pose.faceLandmarks))
        //   }
        //   this.recentPoses.shift();
        //   this.recentPoses.push(results);
        // }
      } else {
        this.currentPose = results;
      }
      context.save();
      context.clearRect(0, 0, canvas.width, canvas.height);

      // context.fillText("Save Poses", 275, 45);
      // create player mirror canvas
      context.globalAlpha = 0.5;
      context.fillStyle = "#4a4d52";
      context.fillRect(
        playerCanvas.startingX,
        playerCanvas.startingY,
        playerCanvas.width,
        playerCanvas.height
      );
      context.fillRect(
        poseOneCanvas.startingX,
        poseOneCanvas.startingY,
        poseOneCanvas.width,
        poseOneCanvas.height
      );
      context.fillRect(
        poseTwoCanvas.startingX,
        poseTwoCanvas.startingY,
        poseTwoCanvas.width,
        poseTwoCanvas.height
      );
      context.globalAlpha = 1;
      // translate context to center of canvas
      if (bodyTooClose(this.currentPose)) { drawProximityWarning(context, playerCanvas) };
      if (poseOne && poseOne.results) {
        poseOne.drawFullBody(context, { color: RED, lineWidth: 1 }, poseOneCanvas);
      }
      if (poseTwo && poseTwo.results) {
        poseTwo.drawFullBody(context, { color: RED, lineWidth: 1 }, poseTwoCanvas);
      }
      if (this.props.poseToSet === "PoseOne" || this.props.comparisonPose == "PoseOne") {
        selectedPose(context, poseOneCanvas)
      } else {
        selectedPose(context, poseTwoCanvas)
      }
      const poseSwitchEvent = new Event('poseSwitch');
      let comparisonPose;
      if (this.props.comparisonPose === "PoseOne") {
        comparisonPose = new Pose(this.currentPose, poseOne.comparisonBodySegments)
        comparisonPose.drawFullBody(context, { color: RED, lineWidth: 3 }, playerCanvas);
        if (comparisonPose.fullyMatched()) { this.dispatchEvent(poseSwitchEvent) }
      } else if (this.props.comparisonPose === "PoseTwo") {
        comparisonPose = new Pose(this.currentPose, poseTwo.comparisonBodySegments)
        comparisonPose.drawFullBody(context, { color: RED, lineWidth: 3 }, playerCanvas);
        if (comparisonPose.fullyMatched()) { this.dispatchEvent(poseSwitchEvent) }
      } else {
        new Pose(this.currentPose).drawFullBody(context, { color: RED, lineWidth: 3 }, playerCanvas);
      }

      if (this.props.counter) {
        context.font = "3em Calibri";
        context.fillStyle = "White";
        context.textAlign = "center";
        context.fillText(
          `${this.props.counter}`,
          playerCanvas.startingX + (playerCanvas.width / 2),
          playerCanvas.startingY + (playerCanvas.height / 2)
        );
      }
      if (this.props.setPose) {
        if (this.props.poseToSet === "PoseOne") {
          poseOne = new Pose(results);
        } else {
          poseTwo = new Pose(results);
        }
        this.setProps({
          setPose: false
          , counter: null
          , desiredPose: {
            poseOne: {
              results: poseOne.results
            },
            poseTwo: {
              results: poseTwo.results
            }
          }
        })
      }
      // context.globalAlpha = 0;
      context.restore();
    }
  }

  static stop(canvas) {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }

  didMount() {
    let canvas = this.children[0];
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    this.engine.holistic.setOptions({
      selfieMode: true,
      maxNumHolistic: 2
    })
    this.engine.holistic.onResults(this.paint(canvas));

    return Promise.resolve();
  }

  render() {
    return `<canvas id="pose-display-canvas" data-layer="base"></canvas>`;
  }
}


PoseDisplay.tag = 'pose-display';


export default PoseDisplay;
