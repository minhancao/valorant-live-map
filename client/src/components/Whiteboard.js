// Updated. Thanks to: Paul Luna
import React, { Component } from "react";

import "antd/dist/antd.css"; // or 'antd/dist/antd.less'

class Whiteboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: false,
      currDrawing: [],
    };
    this.whiteboard = React.createRef();
    this.context = React.createRef();
  }

  componentDidMount() {
    this.setState({
      whiteboard: this.whiteboard.current,
      context: this.whiteboard.current.getContext("2d"),
    });

    this.whiteboard.current.addEventListener(
      "mousedown",
      this.onMouseDown,
      false
    );
    this.whiteboard.current.addEventListener("mouseup", this.onMouseUp, false);
    this.whiteboard.current.addEventListener("mouseout", this.onMouseUp, false);
    this.whiteboard.current.addEventListener(
      "mousemove",
      this.throttle(this.onMouseMove, 5),
      false
    );

    this.whiteboard.current.addEventListener(
      "touchstart",
      this.onMouseDown,
      false
    );

    this.whiteboard.current.addEventListener(
      "touchmove",
      this.throttle(this.onMouseMove, 5),
      false
    );

    this.whiteboard.current.addEventListener("touchend", this.onMouseUp, false);
    window.addEventListener("resize", this.onResize);

    this.props.socket.on("drawing", (data) => {
      if (!isNaN(data.x0) && !isNaN(data.y0)) {
        this.drawLine(data.x0, data.y0, data.x1, data.y1, data.color);
      }
    });

    this.props.socket.on("clear", () => {
      console.log("received to clear");
      this.state.whiteboard
        .getContext("2d")
        .clearRect(0, 0, window.innerWidth, window.innerHeight);
      this.props.clearDrawingsAndRedo();
    });

    this.props.socket.on("pushToDrawings", (room, drawing) => {
      this.props.pushToDrawings(drawing);
      this.props.clearWhiteboard();
      this.props.drawStartBoard();
    });
    this.props.socket.on("loadFromJson", (room, currDrawings) => {
      this.props.clearWhiteboard();
      this.props.handleLoadFromJson(currDrawings);
    });
  }

  drawLine = (x0, y0, x1, y1, color, emit, force) => {
    let context = this.state.whiteboard.getContext("2d");
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    if (!emit) {
      return;
    }

    const data = {
      x0: x0,
      y0: y0,
      x1: x1,
      y1: y1,
      color: color,
      emit: emit,
      force: force,
    };

    var currDrawing = this.state.currDrawing;
    currDrawing.push(data);
    this.setState({ currDrawing });

    this.setState(() => {
      if (!isNaN(x0)) {
        this.props.socket.emit("drawing", {
          x0: x0,
          y0: y0,
          x1: x1,
          y1: y1,
          color: color,
          room: this.props.room,
          force: force,
        });

        return {
          cleared: false,
        };
      }
    });
  };

  onMouseDown = (e) => {
    const offsetLeft = e.clientX - this.whiteboard.current.offsetLeft;
    const offsetTop = e.clientY - this.whiteboard.current.offsetTop;
    this.setState(() => {
      return {
        currentX: offsetLeft,
        currentY: offsetTop,
        drawing: true,
      };
    });
  };

  onMouseUp = (e) => {
    const offsetLeft = e.clientX - this.whiteboard.current.offsetLeft;
    const offsetTop = e.clientY - this.whiteboard.current.offsetTop;
    this.setState(() => {
      return {
        drawing: false,
        currentX: offsetLeft,
        currentY: offsetTop,
      };
    });
    const currDrawing = this.state.currDrawing;
    if (currDrawing.length > 0 && !this.state.drawing) {
      this.props.socket.emit("pushToDrawings", this.props.room, currDrawing);
    }

    this.setState({ currDrawing: [] });
  };

  onMouseMove = (e) => {
    if (!this.state.drawing) {
      return;
    }
    const offsetLeft = e.clientX - this.whiteboard.current.offsetLeft;
    const offsetTop = e.clientY - this.whiteboard.current.offsetTop;
    this.setState(() => {
      return {
        currentX: offsetLeft,
        currentY: offsetTop,
      };
    }, this.drawLine(this.state.currentX, this.state.currentY, offsetLeft, offsetTop, this.props.strokeColor, true));
  };

  onTouchMove = (e) => {
    if (!this.state.drawing) {
      return;
    }
    console.log();
    const offsetLeft =
      e.touches[0].clientX - this.whiteboard.current.offsetLeft;
    const offsetTop = e.touches[0].clientY - this.whiteboard.current.offsetTop;
    this.setState(() => {
      this.drawLine(
        this.state.currentX,
        this.state.currentY,
        offsetLeft,
        offsetTop,
        this.props.strokeColor,
        true,
        e.touches[0].force
      );
      return {
        currentX: offsetLeft,
        currentY: offsetTop,
      };
    });
  };

  onResize = () => {};

  throttle = (callback, delay) => {
    let previousCall = new Date().getTime();
    return function () {
      let time = new Date().getTime();

      if (time - previousCall >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  };

  render() {
    // testing for socket connections

    // const socket = socketIOClient(this.state.endpoint);

    return (
      <div style={{ cursor: "crosshair" }}>
        <canvas
          height={window.innerHeight}
          width={window.innerWidth}
          ref={this.whiteboard}
        ></canvas>
      </div>
    );
  }
}
export default Whiteboard;
