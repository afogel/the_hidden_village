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

monogatari.action('Canvas').objects({
  wireframe: {
    layers: ['wireframe'],
    props: {
      drawWireframe: (wireframe) => {
        const width = wireframe.width;
        const height = wireframe.height;
        let context = wireframe.getContext('2d');
        let drawConnectors = monogatari.mediapipe.drawConnectors;
        let drawLandmarks = monogatari.mediapipe.drawLandmarks;
        return (results) => {
          context.save();
          context.clearRect(0, 0, width, height);
          if (bodyTooClose(results)) {
            context.font = "3em Calibri";
            context.fillStyle = "White";
            context.textAlign = "center";
            context.fillText("You're too close!", width / 2, height * .25);
            context.fillText("Please move back!", width / 2, height * .75);
            context.strokeStyle = 'red';
            context.lineWidth = 15;
            context.strokeRect(0,0, width, height);
          }
          removeLandmarks(results);
          context.drawImage(
            results.image, 0, 0, this.width, this.height);
          drawConnectors(context, results.poseLandmarks, POSE_CONNECTIONS,
            { color: '#00FF00', lineWidth: 4 });
          drawLandmarks(context, results.poseLandmarks,
            { color: '#FF0000', lineWidth: 2 });
          drawConnectors(context, results.faceLandmarks, FACEMESH_TESSELATION,
            { color: '#C0C0C070', lineWidth: 1 });
          drawConnectors(context, results.leftHandLandmarks, HAND_CONNECTIONS,
            { color: '#CC0000', lineWidth: 5 });
          drawLandmarks(context, results.leftHandLandmarks,
            { color: '#00FF00', lineWidth: 2 });
          drawConnectors(context, results.rightHandLandmarks, HAND_CONNECTIONS,
            { color: '#00CC00', lineWidth: 5 });
          drawLandmarks(context, results.rightHandLandmarks,
            { color: '#FF0000', lineWidth: 2 });
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
