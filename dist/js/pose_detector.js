const RED = "#FF0000";
const GREEN = "#00FF00";

// context, results.poseLandmarks,{ color: RED, lineWidth: 2 }
function drawLandmarks(context, landmarks, drawingSpec, canvasSpec) {
  if (landmarks) {
    // toSpec() adds defaults to drawingspec
    drawingSpec = toSpec(drawingSpec);
    context.save();
    // toEnumerable() turns landmarks into an enumerable
    landmarks = toIterator(landmarks);
    for (var landmark = landmarks.next(); !landmark.done; landmark = landmarks.next()) {
      // make sure the landmark is visible
      if (landmark = landmark.value, void 0 !== landmark && !(void 0 !== landmark.visibility && .5 > landmark.visibility)) {
        context.fillStyle = drawingSpec.fillColor
        context.strokeStyle = drawingSpec.color
        context.lineWidth = drawingSpec.lineWidth
        var path = new Path2D;
        let landmarkX = canvasSpec.startingX + (landmark.x * canvasSpec.width);
        let landmarkY = canvasSpec.startingY + (landmark.y * canvasSpec.height);
        if (landmarkX <= canvasSpec.offsetWidth() && landmarkY <= canvasSpec.offsetHeight()) {
          path.arc(
            landmarkX,
            landmarkY,
            drawingSpec.radius,
            0,
            2 * Math.PI
          );
          context.fill(path);
          context.stroke(path);

        }
      }
      context.restore();
    }
  }
}

function drawProximityWarning(context, canvasSpec) {
  let width = canvasSpec.width;
  let height = canvasSpec.height;
  context.font = "3em Calibri";
  context.fillStyle = "White";
  context.textAlign = "center";
  context.fillText(
    "You're too close!",
    canvasSpec.startingX + (width / 2),
    canvasSpec.startingY + (height * .25)
  );
  context.fillText(
    "Please move back!",
    canvasSpec.startingX + (width / 2),
    canvasSpec.startingY + (height * .80)
  );
  context.strokeStyle = 'red';
  context.lineWidth = 15;
  context.strokeRect(canvasSpec.startingX, canvasSpec.startingY, width, height);
}

function bodyTooClose(results) {
  if (results.poseLandmarks) {
    const majorBodyLandmarks = [
      11, 12, // Shoulders
      23, 24, // Hips
      // 25, 26, // Knees
      7, 8    // Middle of head
    ].map((key) => results.poseLandmarks[key].visibility > 0.15)
    const hasInvisibleBodyParts = majorBodyLandmarks.filter((visible) => visible === false).length > 1;
    return hasInvisibleBodyParts;
  }
}


function startCountdown(seconds) {
  let counter = seconds;

  const interval = setInterval(() => {
    console.log(counter);
    counter--;

    if (counter < 0) {
      clearInterval(interval);
      console.log('Ding!');
    }
  }, 1000);
}

class DrawingArea {
  constructor(wireframe, widthPct, heightPct, startingXOffsetPct, startingYOffsetPct) {
    this.width = wireframe.width * widthPct;
    this.height = wireframe.height * heightPct;
    this.startingX = wireframe.width * startingXOffsetPct;
    this.startingY = wireframe.height * startingYOffsetPct;
  }

  offsetWidth() {
    return this.width + this.startingX
  }

  offsetHeight() {
    return this.height + this.startingY
  }
}

monogatari.action('Canvas').objects({
  wireframe: {
    layers: ['wireframe'],
    props: {
      drawWireframe: (wireframe) => {
        const playerCanvas = new DrawingArea(wireframe, 0.55, 0.725, 0.375, 0.125);
        const poseOneCanvas = new DrawingArea(wireframe, 0.325, 0.325, 0.025, 0.125);
        const poseTwoCanvas = new DrawingArea(wireframe, 0.325, 0.325, 0.025, 0.5);

        let context = wireframe.getContext('2d');

        let captureButton = new Path2D();
        captureButton.rect(30, 10, 150, 60);

        let savePoseButton = new Path2D();
        savePoseButton.rect(200, 10, 150, 60);

        let countdownID;
        let counter = 3;
        let setPose = false;
        let latestPoseSet = null;
        let poseOne = null;
        let poseTwo = null;
        let comparisonPose = undefined;
        document.addEventListener('click', function (event) {
          let rect = context.canvas.getBoundingClientRect();
          var x = event.pageX - rect.left,
            y = event.pageY - rect.top;

          if (context.isPointInPath(captureButton, x, y)) {
            countdownID = setInterval(() => {
              counter--;

              if (counter < 0) {
                clearInterval(countdownID);
                counter = 3;
                setPose = true;
                countdownID = null;
              }
            }, 1000);
          }

        }, false);

        return (results) => {
          context.save();
          context.clearRect(0, 0, wireframe.width, wireframe.height);

          context.fillStyle = "#123d75";
          // draw captureButton and savePoseButtons
          context.fill(captureButton);
          context.fill(savePoseButton);
          context.font = "1em Calibri";
          context.fillStyle = "White";
          context.textAlign = "center";

          context.fillText("Capture Pose", 105, 45);
          context.fillText("Save Poses", 275, 45);
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
          if (bodyTooClose(results)) { drawProximityWarning(context, playerCanvas) };
          if (poseOne && poseOne.type === 'PoseOne') {
            poseOne.drawFullBody(context, { color: RED, lineWidth: 1 }, poseOneCanvas);
          }
          if (poseTwo && poseTwo.type === 'PoseTwo') {
            poseTwo.drawFullBody(context, { color: RED, lineWidth: 1 }, poseTwoCanvas);
          }
          if (comparisonPose) {
            new Pose(results, "active", comparisonPose.comparisonBodySegments).drawFullBody(context, { color: RED, lineWidth: 3 }, playerCanvas);
          } else {
            new Pose(results, "active").drawFullBody(context, { color: RED, lineWidth: 3 }, playerCanvas);
          }


          if (countdownID) {
            context.font = "3em Calibri";
            context.fillStyle = "White";
            context.textAlign = "center";
            context.fillText(
              `${counter}`,
              playerCanvas.startingX + (playerCanvas.width / 2),
              playerCanvas.startingY + (playerCanvas.height / 2)
            );
          }
          if (setPose === true ) {
            let bothUnassigned = latestPoseSet === null;
            if (bothUnassigned || (latestPoseSet === "PoseTwo")) {
              poseOne = new Pose(results, "PoseOne");
              latestPoseSet = "PoseOne";
            } else {
              poseTwo = new Pose(results, "PoseTwo");
              latestPoseSet = "PoseTwo";
            }
            setPose = false;
          }
          context.restore();
        }
      }
    },
    start: function({wireframe}, props, state, container) {

      let width = window.innerWidth;
      let height = window.innerHeight;

      wireframe.width = width;
      wireframe.height = height;
      monogatari.holistic.setOptions({
        selfieMode: true,
        maxNumHolistic: 2
      })
      monogatari.holistic.onResults(props.drawWireframe(wireframe));
      const videoElement = document.getElementsByClassName('input_video')[0];

      const camera = new monogatari.mediapipe.Camera(videoElement, {
        onFrame: async () => {
          await monogatari.holistic.send({ image: videoElement });
        },
        width: window.innerWidth,
        height: window.innerHeight,
        facingMode: 'user'
      });
      camera.start();

      return Promise.resolve();
    },
    stop: ({ wireframe }, props, state, container) => {
      wireframe.getContext('2d').clearRect(0, 0, wireframe.width, wireframe.height);
    },
  }
})
