const RED = "#FF0000";

export class Pose {
  constructor(results, desiredPoseSet) {
    this.results = results;
    this.desiredPoseSet = desiredPoseSet;
  }
  static displayName = "Pose";
  static rightForearmConnections = [[13, 15]];
  static rightUpperarmConnections = [[11, 13]];
  static leftForearmConnections = [[14, 16]];
  static leftUpperarmConnections = [[12, 14]];


  drawFullBody(context, drawingSpec, canvasSpec) {
    this._drawConnectors(context, this.results.faceLandmarks, FACEMESH_TESSELATION, { color: RED, lineWidth: 1 }, canvasSpec, false);
    this._drawConnectors(context, this.results.leftHandLandmarks, HAND_CONNECTIONS, drawingSpec, canvasSpec, true);
    this._drawConnectors(context, this.results.rightHandLandmarks, HAND_CONNECTIONS, drawingSpec, canvasSpec, true);
    this._removeFeetLandmarks(this._removeHeadLandmarks(this.results.poseLandmarks));
    if (this.desiredPoseSet) {
      this._drawConnectors(context, this.results.poseLandmarks, FULL_BODY_CONNECTIONS, drawingSpec, canvasSpec, true);

      drawingSpec.color = this._bodySegmentColor(this._rightArm, this.desiredPoseSet.rightArm);
      this._drawConnectors(context, this.results.poseLandmarks, Pose.rightForearmConnections, drawingSpec, canvasSpec, true);
      drawingSpec.color = this._bodySegmentColor(this._rightShoulder, this.desiredPoseSet.rightShoulder);
      this._drawConnectors(context, this.results.poseLandmarks, Pose.rightUpperarmConnections, drawingSpec, canvasSpec, true);
      drawingSpec.color = this._bodySegmentColor(this._leftArm, this.desiredPoseSet.leftArm);
      this._drawConnectors(context, this.results.poseLandmarks, Pose.leftForearmConnections, drawingSpec, canvasSpec, true);
      drawingSpec.color = this._bodySegmentColor(this._leftShoulder, this.desiredPoseSet.leftShoulder);
      this._drawConnectors(context, this.results.poseLandmarks, Pose.leftUpperarmConnections, drawingSpec, canvasSpec, true);
    } else {
      this._drawConnectors(context, this.results.poseLandmarks, POSE_CONNECTIONS, drawingSpec, canvasSpec, true);
    }
  }

  _drawConnectors(context, landmarks, landmarkConnections, drawingSpec, canvasSpec, sketchEffect) {
    let strokeStyle = context.strokeStyle;
    if (landmarks && landmarkConnections) {
      drawingSpec = this._toSpec(drawingSpec);
      context.save();
      context.beginPath();
      landmarkConnections = this._toIterator(landmarkConnections);
      for (var connection = landmarkConnections.next(); !connection.done; connection = landmarkConnections.next()) {
        let landmark_pair = connection.value;
        let startingLandmark = landmarks[landmark_pair[0]];
        let finishingLandmark = landmarks[landmark_pair[1]];
        if (startingLandmark && finishingLandmark) {
          let startingLandmarkX = canvasSpec.startingX + (startingLandmark.x * canvasSpec.width);
          let startingLandmarkY = canvasSpec.startingY + (startingLandmark.y * canvasSpec.height);
          let finishingLandmarkX = canvasSpec.startingX + (finishingLandmark.x * canvasSpec.width);
          let finishingLandmarkY = canvasSpec.startingY + (finishingLandmark.y * canvasSpec.height);
          if (
            startingLandmarkX <= canvasSpec.offsetWidth() &&
            finishingLandmarkX <= canvasSpec.offsetWidth() &&
            startingLandmarkY <= canvasSpec.offsetHeight() &&
            finishingLandmarkY <= canvasSpec.offsetHeight()
          ) {
            context.strokeStyle = drawingSpec.color
            context.lineWidth = drawingSpec.lineWidth
            context.moveTo(startingLandmarkX, startingLandmarkY);
            context.lineTo(finishingLandmarkX, finishingLandmarkY);
            if (sketchEffect) {
              context.moveTo(startingLandmarkX - this._getRandomInt(1, 3), startingLandmarkY - this._getRandomInt(1, 3));
              context.lineTo(finishingLandmarkX - this._getRandomInt(1, 3), finishingLandmarkY - this._getRandomInt(1, 3));
              context.moveTo(startingLandmarkX + this._getRandomInt(1, 3), startingLandmarkY + this._getRandomInt(1, 3));
              context.lineTo(finishingLandmarkX + this._getRandomInt(1, 3), finishingLandmarkY + this._getRandomInt(1, 3));
            }
          }
        }
      }
    }
    context.stroke();
    context.restore();
    context.strokeStyle = strokeStyle;
  }

  get _rightArm() {
    return [this.results.poseLandmarks[11], this.results.poseLandmarks[13], this.results.poseLandmarks[15]];
  }

  get _leftArm() {
    return [this.results.poseLandmarks[12], this.results.poseLandmarks[14], this.results.poseLandmarks[16]];
  }

  get _rightShoulder() {
    return [this.results.poseLandmarks[23], this.results.poseLandmarks[11], this.results.poseLandmarks[13]];
  }

  get _leftShoulder() {
    return [this.results.poseLandmarks[24], this.results.poseLandmarks[12], this.results.poseLandmarks[14]];
  }

  get comparisonBodySegments() {
    return {
      rightArm: this._rightArm,
      leftArm: this._leftArm,
      rightShoulder: this._rightShoulder,
      leftShoulder: this._leftShoulder
    }
  }

  _getAngle(firstPoint, midPoint, lastPoint) {
    let radians = Math.atan2(lastPoint.y - midPoint.y, lastPoint.x - midPoint.x) - Math.atan2(firstPoint.y - midPoint.y, firstPoint.x - midPoint.x);
    return radians;
  }

  _removeHeadLandmarks(landmarks) {
    this._removeElements(landmarks, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    return landmarks;
  }

  _removeArmLandmarks(landmarks) {
    this._removeElements(landmarks, [
      // 14,16, // left arm
      // 13, 15 // right arm
    ])
    return landmarks;
  }

  _removeFeetLandmarks(landmarks) {
    this._removeElements(landmarks, [17, 18, 19, 20, 21, 22])
    return landmarks;
  }

  fullyMatched() {
    return (this._segmentSimilarity(this._rightArm, this.desiredPoseSet.rightArm) >= 80) &&
      (this._segmentSimilarity(this._rightShoulder, this.desiredPoseSet.rightShoulder) >= 80) &&
      (this._segmentSimilarity(this._leftArm, this.desiredPoseSet.leftArm) >= 80) &&
      (this._segmentSimilarity(this._leftShoulder, this.desiredPoseSet.leftShoulder) >= 80);
  }

  /***************
   * _toSpec() adds defaults to the passed in drawingSpec
   * @drawingSpec -- Object
  ****************/
  _toSpec(drawingSpec) {
    const defaultSpec = {
      color: "white",
      lineWidth: 4,
      radius: 6
    };
    drawingSpec = drawingSpec || {};
    return Object.assign(Object.assign(Object.assign({}, defaultSpec), {
      fillColor: drawingSpec.color
    }), drawingSpec)
  }

  /**
   *
   * @param {*} ownBodySegment
   * @param {*} desiredBodySegment
   * @returns
   */
  _bodySegmentColor(ownBodySegment, desiredBodySegment) {
    return this._perc2color(this._segmentSimilarity(ownBodySegment, desiredBodySegment));
  }

  _segmentSimilarity(ownBodySegment, desiredBodySegment) {
    return this._angle2percent(
      this._getAngle(
        ownBodySegment[0],
        ownBodySegment[1],
        ownBodySegment[2]
      ),
      this._getAngle(
        desiredBodySegment[0],
        desiredBodySegment[1],
        desiredBodySegment[2]
      )
    )
  }

  _angle2percent(currentAngle, desiredAngle) {
    let translation = (Math.PI * 0.5) - desiredAngle;
    let angle = currentAngle + translation;
    if (angle <= (Math.PI * 0.5) && angle >= 0) {
      // pi over two
      return 5.94111 * Math.exp(angle * 1.82266);
      // 5.94111 e ^ ( x)
    } else if (angle > (Math.PI * 0.5) && angle <= Math.PI) {
      return 1822.46 * Math.exp(angle * -1.82266);
    } else {
      return 0
    }
  }

  _perc2color(percentage) {
    var r, g, b = 0;
    if (percentage < 50) {
      r = 255;
      g = Math.round(5.1 * percentage);
    } else {
      g = 255;
      r = Math.round(510 - 5.10 * percentage);
    }
    var h = r * 0x10000 + g * 0x100 + b * 0x1;
    return '#' + ('000000' + h.toString(16)).slice(-6);
  }

  /****
   * _next() is
   */
  _next(object) {
    var iteratorCount = 0;
    return function () {
      return iteratorCount < object.length ? {
        done: !1,
        value: object[iteratorCount++]
      } : {
        done: !0
      }
    }
  }

  _toIterator(object) {
    var isIterator = "undefined" != typeof Symbol && Symbol.iterator && object[Symbol.iterator];
    return isIterator ? isIterator.call(object) : {
      next: this._next(object)
    }
  }

  _getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _removeElements(landmarks, elements) {
    for (const element of elements) {
      delete landmarks[element];
    }
  }
}
