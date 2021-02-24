(function() {
  /*

   Copyright The Closure Library Authors.
   SPDX-License-Identifier: Apache-2.0
  */
  'use strict';

  function g(a) {
    var c = 0;
    return function() {
      return c < a.length ? {
        done: !1,
        value: a[c++]
      } : {
        done: !0
      }
    }
  }

  function h(a) {
    var c = "undefined" != typeof Symbol && Symbol.iterator && a[Symbol.iterator];
    return c ? c.call(a) : {
      next: g(a)
    }
  }
  var k = "function" == typeof Object.defineProperties ? Object.defineProperty : function(a, c, b) {
    if (a == Array.prototype || a == Object.prototype) return a;
    a[c] = b.value;
    return a
  };

  function m(a) {
    a = ["object" == typeof globalThis && globalThis, a, "object" == typeof window && window, "object" == typeof self && self, "object" == typeof global && global];
    for (var c = 0; c < a.length; ++c) {
      var b = a[c];
      if (b && b.Math == Math) return b
    }
    throw Error("Cannot find global object");
  }
  var n = m(this);

  function p(a, c) {
    if (c) a: {
      var b = n;a = a.split(".");
      for (var d = 0; d < a.length - 1; d++) {
        var e = a[d];
        if (!(e in b)) break a;
        b = b[e]
      }
      a = a[a.length - 1];d = b[a];c = c(d);c != d && null != c && k(b, a, {
        configurable: !0,
        writable: !0,
        value: c
      })
    }
  }
  var q = "function" == typeof Object.assign ? Object.assign : function(a, c) {
    for (var b = 1; b < arguments.length; b++) {
      var d = arguments[b];
      if (d)
        for (var e in d) Object.prototype.hasOwnProperty.call(d, e) && (a[e] = d[e])
    }
    return a
  };
  p("Object.assign", function(a) {
    return a || q
  });
  p("Array.prototype.fill", function(a) {
    return a ? a : function(c, b, d) {
      var e = this.length || 0;
      0 > b && (b = Math.max(0, e + b));
      if (null == d || d > e) d = e;
      d = Number(d);
      0 > d && (d = Math.max(0, e + d));
      for (b = Number(b || 0); b < d; b++) this[b] = c;
      return this
    }
  });

  function r(a) {
    return a ? a : Array.prototype.fill
  }
  p("Int8Array.prototype.fill", r);
  p("Uint8Array.prototype.fill", r);
  p("Uint8ClampedArray.prototype.fill", r);
  p("Int16Array.prototype.fill", r);
  p("Uint16Array.prototype.fill", r);
  p("Int32Array.prototype.fill", r);
  p("Uint32Array.prototype.fill", r);
  p("Float32Array.prototype.fill", r);
  p("Float64Array.prototype.fill", r);
  var t = this || self;

  function u(a, c) {
    a = a.split(".");
    var b = t;
    a[0] in b || "undefined" == typeof b.execScript || b.execScript("var " + a[0]);
    for (var d; a.length && (d = a.shift());) a.length || void 0 === c ? b[d] && b[d] !== Object.prototype[d] ? b = b[d] : b = b[d] = {} : b[d] = c
  };
  var v = {
    color: "white",
    lineWidth: 4,
    radius: 6
  };

  function w(a) {
    a = a || {};
    return Object.assign(Object.assign(Object.assign({}, v), {
      fillColor: a.color
    }), a)
  }

  function x(a, c) {
    return c && a instanceof Function ? a(c) : a
  }

  function y(a, c, b) {
    return Math.max(Math.min(c, b), Math.min(Math.max(c, b), a))
  }
  u("clamp", y);
  u("drawLandmarks", function(a, c, b) {
    if (c) {
      b = w(b);
      a.save();
      var d = a.canvas;
      c = h(c);
      for (var e = c.next(); !e.done; e = c.next())
        if (e = e.value, void 0 !== e && !(void 0 !== e.visibility && .1 > e.visibility)) {
          a.fillStyle = x(b.fillColor, e);
          a.strokeStyle = x(b.color, e);
          a.lineWidth = x(b.lineWidth, e);
          var f = new Path2D;
          f.arc(e.x * d.width, e.y * d.height, x(b.radius, e), 0, 2 * Math.PI);
          a.fill(f);
          a.stroke(f)
        } a.restore()
    }
  });
  u("drawConnectors", function(context, landmarks, connections, drawingSpec) {
    if (landmarks && connections) {
      // w() is a wrapper for adding the defaults to drawing spec if not defined
      drawingSpec = w(drawingSpec);
      context.save();
      var canvas = context.canvas;
      context.beginPath();
      // h() turns connections into a range iterator;
      connections = h(connections);
      for (var connection = connections.next(); !connection.done; connection = connections.next()) {
        var pointSet = connection.value;
        var startPoint = landmarks[pointSet[0]];
        var endPoint = landmarks[pointSet[1]];
        // only try to draw if both to and startPoint are defined
        startPoint && endPoint && (
          context.strokeStyle = x(drawingSpec.color, startPoint),
          context.lineWidth = x(drawingSpec.lineWidth, startPoint),
          context.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height),
          context.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height)
        )
      }
      context.stroke();
      context.restore()
    }
  });

  u("drawRectangle", function(a, c, b) {
    b = w(b);
    a.save();
    var d = a.canvas;
    a.scale(d.width, d.height);
    a.fillStyle = x(b.color);
    a.translate(c.xCenter, c.yCenter);
    a.rotate(c.rotation * Math.PI / 180);
    a.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
    a.restore()
  });
  u("lerp", function(a, c, b, d, e) {
    return y(d * (1 - (a - c) / (b - c)) + e * (1 - (b - a) / (b - c)), d, e)
  });
}).call(this);
