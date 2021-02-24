// const drawConnectors = monogatari.mediapipe.drawConnectors;
// const drawLandmarks = monogatari.mediapipe.drawLandmarks;
const RED = "#FF0000";
const GREEN = "#00FF00";
// drawLandmarks(context, results.poseLandmarks,
//   { color: '#FF0000', lineWidth: 2 });
// iterator
// function g(a) {
//   var c = 0;
//   return function () {
//     return c < a.length ? {
//       done: !1,
//       value: a[c++]
//     } : {
//         done: !0
//       }
//   }
// }
// // transform landmarks into an iteractor
// function h(a) {
//   var c = "undefined" != typeof Symbol && Symbol.iterator && a[Symbol.iterator];
//   return c ? c.call(a) : {
//     next: g(a)
//   }
// }

// // function x(a, c) {
// //   return c && a instanceof Function ? a(c) : a
// // }
// const drawLandmarks = function (context, landmarks, drawingSpec) {
//   if (landmarks) {
//     drawingSpec = w(drawingSpec);
//     context.save();
//     let canvas = context.canvas;
//     // landmarks = h(landmarks);
//     landmarks.forEach(landmark => {
//       if (landmark = landmark.value, void 0 !== landmark && !(void 0 !== landmark.visibility && .1 > landmark.visibility)) {
//         context.fillStyle = x(drawingSpec.fillColor, landmark);
//         context.strokeStyle = x(drawingSpec.color, landmark);
//         context.lineWidth = x(drawingSpec.lineWidth, landmark);
//         var f = new Path2D;
//         f.arc(
//           landmark.x * canvas.width,
//           landmark.y * canvas.height,
//           x(drawingSpec.radius, landmark),
//           0,
//           2 * Math.PI
//         );
//         context.fill(f);
//         context.stroke(f)
//       }
//       context.restore()
//     });
//     for (var e = landmarks.next(); !e.done; e = landmarks.next())

//   }
// }

function getRightArm(results) {
  return [results.poseLandmarks[11], results.poseLandmarks[13], results.poseLandmarks[15]];
  return [results.poseLandmarks[11], results.poseLandmarks[13], results.rightHandLandmarks[0]];
}

function getLeftArm(results) {
  return [results.poseLandmarks[12], results.poseLandmarks[14], results.poseLandmarks[16]];
  return [results.poseLandmarks[12], results.poseLandmarks[14], results.leftHandLandmarks[0]];
}

function removeElements(landmarks, elements) {
  for (const element of elements) {
    delete landmarks[element];
  }
}

function removeLandmarks(results) {
  if (results.poseLandmarks) {
    removeElements(
      results.poseLandmarks,
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 17, 18, 19, 20, 21, 22]);
  }
}

function getAngle(firstPoint, midPoint, lastPoint) {
  // let result =
  radians =  Math.atan2(lastPoint.y - midPoint.y, lastPoint.x - midPoint.x) -
    Math.atan2(firstPoint.y - midPoint.y, firstPoint.x - midPoint.x);
  degrees = radians * (180 / Math.PI);
    // );

  degrees = Math.abs(degrees); // Angle should never be negative
  if (degrees > 180) {
    degrees = (360.0 - degrees); // Always get the acute representation of the angle
  }
  return degrees;
}

function drawProximityWarning(context) {
  let canvas = context.canvas;
  let width = canvas.width;
  let height = canvas.height;
  context.font = "3em Calibri";
  context.fillStyle = "White";
  context.textAlign = "center";
  context.fillText("You're too close!", width / 2, height * .25);
  context.fillText("Please move back!", width / 2, height * .75);
  context.strokeStyle = 'red';
  context.lineWidth = 15;
  context.strokeRect(0, 0, width, height);
}

function bodyTooClose(results) {
  if (results.poseLandmarks) {
    const majorBodyLandmarks = [
      11, 12, // Shoulders
      23, 24, // Hips
      25, 26, // Knees
      7, 8    // Middle of head
    ].map((key) => results.poseLandmarks[key].visibility > 0.15)
    const hasInvisibleBodyParts = majorBodyLandmarks.filter((visible) => visible === false).length > 1;
    return hasInvisibleBodyParts;
  }
}

function labelArms(context, results) {
  let canvas = context.canvas;
  let width = canvas.width;
  let height = canvas.height;
  const ARM_LANDMARKS = [11,13,15,12,14,16]
  let arms = results.poseLandmarks;
  ARM_LANDMARKS.forEach(element => {
    context.fillStyle = "White";
    context.font = "0.5em Calibri";
    context.fillText(element.toString(), arms[element].x * width, arms[element].y * height);
  });
}

monogatari.action('Canvas').objects({
  wireframe: {
    layers: ['wireframe'],
    props: {
      drawWireframe: (wireframe) => {
        const width = wireframe.width;
        const height = wireframe.height;
        let context = wireframe.getContext('2d');

        return (results) => {
          context.save();
          context.clearRect(0, 0, width, height);
          if (bodyTooClose(results)) { drawProximityWarning(context) };
          removeLandmarks(results);
          context.drawImage(
            results.image, 0, 0, this.width, this.height);
          drawConnectors(context, results.poseLandmarks, POSE_CONNECTIONS,
            { color: RED, lineWidth: 4 });
          let arm = getRightArm(results);
          let angle = getAngle(arm[0], arm[1], arm[2]);
          if (angle >= 60 && angle <= 120) {
            drawConnectors(context, results.poseLandmarks, [[11, 13], [13, 15]], { color: GREEN, lineWidth: 4 });
          } else {
            drawConnectors(context, results.poseLandmarks, [[11, 13], [13, 15]], { color: RED, lineWidth: 4 });
          }
          drawLandmarks(context, results.poseLandmarks,
            { color: RED, lineWidth: 2 });
          labelArms(context, results);

          drawConnectors(context, results.faceLandmarks, FACEMESH_TESSELATION,
            { color: '#C0C0C070', lineWidth: 1 });
          drawConnectors(context, results.leftHandLandmarks, HAND_CONNECTIONS,
            { color: '#CC0000', lineWidth: 5 });
          drawLandmarks(context, results.leftHandLandmarks,
            { color: RED, lineWidth: 2 });
          drawConnectors(context, results.rightHandLandmarks, HAND_CONNECTIONS,
            { color: '#00CC00', lineWidth: 5 });
          drawLandmarks(context, results.rightHandLandmarks,
            { color: RED, lineWidth: 2 });
          context.restore();
        }
      }
    },
    start: function({wireframe}, props, state, container) {
      let width = 640;
      let height = 360;

      wireframe.width = width;
      wireframe.height = height;
      monogatari.holistic.onResults(props.drawWireframe(wireframe));
      const videoElement = document.getElementsByClassName('input_video')[0];

      const camera = new monogatari.mediapipe.Camera(videoElement, {
        onFrame: async () => {
          await monogatari.holistic.send({ image: videoElement });
        },
        width: 1280,
        height: 720
      });
      camera.start();

      return Promise.resolve();
    },
    stop: ({ wireframe }, props, state, container) => {
      wireframe.getContext('2d').clearRect(0, 0, wireframe.width, wireframe.height);
    },
  }
})
