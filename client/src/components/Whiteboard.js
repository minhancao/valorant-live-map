// Updated. Thanks to: Paul Luna
import React, { Component } from "react";
import socketIOClient from "socket.io-client";
import { SketchField, Tools } from "react-sketch";
import { Layout, Menu, Breadcrumb, Input, Button, Switch } from "antd";
import {
  DesktopOutlined,
  PieChartOutlined,
  FileOutlined,
  TeamOutlined,
  UserOutlined,
  UploadOutlined,
  BgColorsOutlined,
} from "@ant-design/icons";
import { CompactPicker } from "react-color";
import "antd/dist/antd.css"; // or 'antd/dist/antd.less'
import CanvasDraw from "react-canvas-draw";

const { Header, Content, Footer, Sider } = Layout;
const { SubMenu } = Menu;

class Whiteboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: false,
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
      this.throttle(this.onTouchMove, 5),
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
    });
  }

  drawLine = (x0, y0, x1, y1, color, emit, force) => {
    let context = this.state.whiteboard.getContext("2d");
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 2;
    // if (force) {
    // 	context.lineWidth = 1.75 * (force * (force + 3.75));
    // }
    context.stroke();
    context.closePath();

    if (!emit) {
      return;
    }

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

  // leave = () => {
  //   socket.emit("leaveroom", { id: this.state.id, room: this.props.room });
  // };

  // adding the function
  setFillWithBackgroundColor = () => {
    this.setState(
      { fillWithBackgroundColor: !this.state.fillWithBackgroundColor },
      () => {
        this.props.socket.emit(
          "change fillWithBackgroundColor",
          this.state.fillWithBackgroundColor
        );
      }
    );
  };

  // adding the function
  setBackgroundColor = (backgroundColor) => {
    this.setState({ backgroundColor }, () => {
      this.props.socket.emit(
        "change backgroundColor",
        this.state.backgroundColor
      );
    });
  };

  onCollapse = (collapsed) => {
    console.log(collapsed);
    this.setState({ collapsed });
  };

  _onBackgroundImageDrop = (accepted /*, rejected*/) => {
    if (accepted && accepted.length > 0) {
      let reader = new FileReader();
      let { stretched, stretchedX, stretchedY, originX, originY } = this.state;
      reader.addEventListener(
        "load",
        () =>
          this._sketch.setBackgroundFromDataUrl(reader.result, {
            stretched: stretched,
            stretchedX: stretchedX,
            stretchedY: stretchedY,
            originX: originX,
            originY: originY,
          }),
        false
      );
      reader.readAsDataURL(accepted[0]);
    }
  };

  _onImageDrop = (accepted /*, rejected*/) => {
    if (accepted && accepted.length > 0) {
      let reader = new FileReader();
      let { stretched, stretchedX, stretchedY, originX, originY } = this.state;
      reader.addEventListener(
        "load",
        () => this._sketch.addImg(reader.result),
        false
      );
      console.log(reader.readAsDataURL(accepted[0]));
    }
  };

  _onSketchChange = () => {
    let prev = this.state.canUndo;
    let now = this._sketch.canUndo();
    if (prev !== now) {
      this.setState({ canUndo: now });
    }
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
