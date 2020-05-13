// Updated. Thanks to: Paul Luna
import React, { Component } from "react";
import io from "socket.io-client";
import { Layout, Menu, Button, Switch, Tooltip, List } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import { CompactPicker } from "react-color";
import "antd/dist/antd.css"; // or 'antd/dist/antd.less'
import Whiteboard from "./Whiteboard";

import BindMap from "./imgs/bind.svg";
import HavenMap from "./imgs/haven.svg";
import SplitMap from "./imgs/split.svg";
import "./WhiteboardContainer.css";

const { Content, Sider, Header } = Layout;

const socket = io();

class WhiteboardContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: false,
      strokeColor: "black",
      clearBoard: false,
      map: BindMap,
      isDesktop: false,
      id: null,
      username: null,
      room: null,
      userList: [],
      drawings: [],
      redo: [],
      undo: [],
      selectedMap: "1",
    };

    this.updatePredicate = this.updatePredicate.bind(this);
    this.whiteboard = React.createRef();

    socket.emit("join", {
      username: this.props.username,
      room: this.props.room,
    });

    socket.on("joined", (joined) => {
      this.setState({
        id: joined.id,
        username: joined.username,
        room: joined.room,
        drawings: joined.drawings,
        redo: joined.redo,
      });
    });

    socket.on("users", (users) => {
      this.setState({
        userList: users,
      });
    });

    socket.on("change backgroundColor", (room, backgroundCol) => {
      this.setState({
        backgroundColor: backgroundCol,
      });
    });
    socket.on("change fillWithBackgroundColor", (room, fillBg) => {
      this.setState({
        fillWithBackgroundColor: fillBg,
      });
    });

    socket.on("redo", (room) => {
      this.redo();
    });

    socket.on("undo", (room) => {
      this.undo();
    });

    socket.on("mapChange", (mapItem, selected) => {
      this.setState({ map: mapItem, selectedMap: selected }, () => {
        this.redrawOnChange(this.state.drawings);
      });
    });
  }

  componentDidMount() {
    this.updatePredicate();
    window.addEventListener("resize", this.updatePredicate);
    var reader = new FileReader();
    document
      .getElementById("loadFromJson")
      .addEventListener("change", function () {
        if (this.files[0]) {
          // read the contents of the first file in the <input type="file">
          reader.readAsText(this.files[0]);
        }
      });

    // this function executes when the contents of the file have been fetched
    reader.onload = function () {
      var data = JSON.parse(reader.result);
      var currDrawings = data.drawings;
      socket.emit("loadFromJson", this.state.room, currDrawings);
    }.bind(this);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updatePredicate);
  }

  updatePredicate() {
    this.setState({ isDesktop: window.innerWidth > 1450 });
  }

  // sending sockets
  // send = () => {
  //   const socket = socketIOClient(this.state.endpoint);
  //   socket.emit("change backgroundColor", this.state.backgroundColor); // change 'red' to this.state.color
  // };
  ///

  // adding the function
  setFillWithBackgroundColor = () => {
    this.setState(
      { fillWithBackgroundColor: !this.state.fillWithBackgroundColor },
      () => {
        socket.emit(
          "change fillWithBackgroundColor",
          this.state.room,
          this.state.fillWithBackgroundColor
        );
      }
    );
  };

  // adding the function
  setBackgroundColor = (backgroundColor) => {
    this.setState({ backgroundColor }, () => {
      socket.emit(
        "change backgroundColor",
        this.state.room,
        this.state.backgroundColor
      );
    });
  };

  changeStrokeColor = (color) => {
    this.setState(() => {
      socket.emit("color-change", {
        id: this.state.id,
        username: this.state.username,
        room: this.state.room,
        color: color,
      });
      return {
        strokeColor: color,
      };
    });
  };

  onCollapse = (collapsed) => {
    this.setState({ collapsed });
  };

  clearBoard = () => {
    socket.emit("clear", this.state.room);
  };

  leave = () => {
    socket.emit("leaveroom", { id: this.state.id, room: this.state.room });
    this.props.clearRoom();
  };

  saveAsDataURL = () => {
    // retrieve the canvas data
    var canvas = this.whiteboard.current.whiteboard.current;
    var canvasContents = canvas.toDataURL(); // a data URL of the current canvas image

    // create a blob object representing the data as a JSON string
    var file = new Blob([canvasContents], {
      type: "text",
    });

    // trigger a click event on an <a> tag to open the file explorer
    var a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = "data.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  saveAsJson = () => {
    // retrieve the canvas data
    var data = { drawings: this.state.drawings };
    var string = JSON.stringify(data);
    // create a blob object representing the data as a JSON string
    var file = new Blob([string], {
      type: "application/json",
    });
    // trigger a click event on an <a> tag to open the file explorer
    var a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  saveAsPng = () => {
    this.clearWhiteboard();
    var canvas = this.whiteboard.current.whiteboard.current;
    var ctx = canvas.getContext("2d");
    var currDrawings = this.state.drawings;
    var bgImage = new Image();
    bgImage.src = this.state.map;
    var x = (canvas.width - bgImage.width) * 0.5, // this = image loaded
      y = (canvas.height - bgImage.height) * 0.5;
    ctx.drawImage(bgImage, x, y);

    var i = 0;
    var j = 0;
    for (i = 0; i < currDrawings.length; i++) {
      var data = currDrawings[i];
      for (j = 0; j < data.length; j++) {
        var data2 = data[j];
        var { x0, y0, x1, y1, color } = data2;
        this.drawOnWhiteboard(x0, y0, x1, y1, color);
      }
    }

    // trigger a click event on an <a> tag to open the file explorer
    var link = document.createElement("a");
    link.setAttribute("download", "data.png");
    link.setAttribute(
      "href",
      canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")
    );
    link.click();

    this.redrawOnChange(currDrawings);
  };

  clearWhiteboard = () => {
    var canvas = this.whiteboard.current.whiteboard.current;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  clearDrawingsAndRedo = () => {
    this.setState({ drawings: [], redo: [] });
  };

  drawOnWhiteboard = (x0, y0, x1, y1, color) => {
    var canvas = this.whiteboard.current.whiteboard.current;
    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
  };

  drawStartBoard = () => {
    var currDrawings = this.state.drawings;
    var i = 0;
    var j = 0;
    for (i = 0; i < currDrawings.length; i++) {
      var data = currDrawings[i];
      for (j = 0; j < data.length; j++) {
        var data2 = data[j];
        var { x0, y0, x1, y1, color } = data2;
        this.drawOnWhiteboard(x0, y0, x1, y1, color);
      }
    }
  };

  handleLoadFromJson = (currDrawings) => {
    this.setState({ drawings: currDrawings });
    this.clearWhiteboard();
    var i = 0;
    var j = 0;
    for (i = 0; i < currDrawings.length; i++) {
      var data = currDrawings[i];
      for (j = 0; j < data.length; j++) {
        var data2 = data[j];
        var { x0, y0, x1, y1, color } = data2;
        this.drawOnWhiteboard(x0, y0, x1, y1, color);
      }
    }
  };

  pushToDrawings = (data) => {
    var currDrawings = this.state.drawings;
    currDrawings.push(data);
    this.setState({ drawings: currDrawings, redo: [] });
  };

  undoEmit = () => {
    socket.emit("undo", this.state.room);
  };

  redoEmit = () => {
    socket.emit("redo", this.state.room);
  };

  undo = () => {
    if (this.state.drawings.length === 0) {
      return;
    }

    var currDrawings = this.state.drawings;
    var poppedItem = currDrawings.pop();

    var currRedo = this.state.redo;
    currRedo.push(poppedItem);

    this.redrawOnChange(currDrawings);
    this.setState({ drawings: currDrawings, redo: currRedo });
  };

  redo = () => {
    if (this.state.redo.length === 0) {
      return;
    }
    var currRedo = this.state.redo;
    var poppedItem = currRedo.pop();

    var currDrawings = this.state.drawings;
    currDrawings.push(poppedItem);

    this.redrawOnChange(currDrawings);
    this.setState({ drawings: currDrawings, redo: currRedo });
  };

  redrawOnChange = (currDrawings) => {
    this.clearWhiteboard();
    var i = 0;
    var j = 0;
    for (i = 0; i < currDrawings.length; i++) {
      var data = currDrawings[i];
      for (j = 0; j < data.length; j++) {
        var data2 = data[j];
        var { x0, y0, x1, y1, color } = data2;
        this.drawOnWhiteboard(x0, y0, x1, y1, color);
      }
    }
  };

  render() {
    // testing for socket connections

    // const socket = socketIOClient(this.state.endpoint);

    return (
      <div>
        <Layout style={{ minHeight: "100vh" }}>
          <Header>
            <Menu
              title=""
              theme="dark"
              mode="horizontal"
              selectedKeys={[this.state.selectedMap]}
            >
              <Menu.Item
                key="1"
                id="bindmap"
                onClick={() => {
                  socket.emit("mapChange", this.state.room, BindMap, "1");
                  this.setState({ map: BindMap, selectedMap: "1" });
                }}
              >
                Bind
              </Menu.Item>
              <Menu.Item
                key="2"
                id="havenmap"
                onClick={() => {
                  socket.emit("mapChange", this.state.room, HavenMap, "2");
                  this.setState({ map: HavenMap, selectedMap: "2" });
                }}
              >
                Haven
              </Menu.Item>
              <Menu.Item
                key="3"
                id="splitmap"
                onClick={() => {
                  socket.emit("mapChange", this.state.room, SplitMap, "3");
                  this.setState({ map: SplitMap, selectedMap: "3" });
                }}
              >
                Split
              </Menu.Item>
              <Menu.Item key="4" onClick={() => this.leave()}>
                Leave Room
              </Menu.Item>
              <Menu.Item
                key="5"
                disabled={true}
                style={{ float: "right", cursor: "pointer" }}
              >
                <Tooltip
                  placement="bottomRight"
                  title={
                    <List
                      size="small"
                      bordered
                      dataSource={this.state.userList}
                      renderItem={(item) => (
                        <List.Item style={{ color: item.color }}>
                          {item.username}
                        </List.Item>
                      )}
                    />
                  }
                >
                  <TeamOutlined></TeamOutlined>
                </Tooltip>
              </Menu.Item>

              <Menu.Item key="6" disabled={true} style={{ float: "right" }}>
                Count: {this.state.userList.length}
              </Menu.Item>
              <Menu.Item key="7" disabled={true} style={{ float: "right" }}>
                Room {this.props.room} | User: {this.props.username}
              </Menu.Item>
            </Menu>
          </Header>
          <Layout>
            <Sider
              width={this.state.isDesktop ? "20%" : "90%"}
              theme="light"
              breakpoint="lg"
              collapsedWidth="0"
              collapsible
              collapsed={this.state.collapsed}
              onCollapse={this.onCollapse}
            >
              <div className="logo" />
              <Menu theme="light" defaultSelectedKeys={["8"]} mode="inline">
                <Menu.Item
                  key="8"
                  icon={
                    <div>
                      <CompactPicker
                        style={{ width: "100%", height: "auto" }}
                        color={this.state.backgroundColor}
                        onChange={(color) => this.setBackgroundColor(color.hex)}
                      />
                      <Switch
                        checked={this.state.fillWithBackgroundColor}
                        onChange={(e) => this.setFillWithBackgroundColor()}
                      />
                    </div>
                  }
                  style={{ height: "100px" }}
                ></Menu.Item>
                <Menu.Item
                  key="9"
                  icon={
                    <CompactPicker
                      color={this.state.strokeColor}
                      onChange={(color) => this.changeStrokeColor(color.hex)}
                    />
                  }
                  style={{ height: "100px" }}
                ></Menu.Item>
                <Menu.Item
                  key="10"
                  icon={
                    <div>
                      <Button onClick={() => this.undoEmit()}>Undo</Button>
                      <Button onClick={() => this.redoEmit()}>Redo</Button>
                      <Button onClick={() => this.clearBoard()}>Clear</Button>
                    </div>
                  }
                ></Menu.Item>
                <Menu.Item
                  key="11"
                  icon={
                    <div>
                      <Button onClick={() => this.saveAsJson()}>
                        Save as JSON
                      </Button>
                      <input
                        type="file"
                        id="loadFromJson"
                        style={{ display: "none" }}
                      />
                      <Button
                        onClick={() =>
                          document.getElementById("loadFromJson").click()
                        }
                      >
                        Load from JSON
                      </Button>
                    </div>
                  }
                ></Menu.Item>
                <Menu.Item
                  key="12"
                  icon={
                    <div>
                      <Button onClick={() => this.saveAsPng()}>
                        Save as PNG
                      </Button>
                    </div>
                  }
                ></Menu.Item>
              </Menu>
            </Sider>
            <Layout style={{ overflowY: "hidden" }}>
              <Content style={{ margin: "0 16px" }}>
                <div
                  ref="drawArea"
                  className="site-layout-background"
                  style={{
                    minHeight: 360,
                    height: "93vh",
                    backgroundColor: this.state.fillWithBackgroundColor
                      ? this.state.backgroundColor
                      : "transparent",
                  }}
                >
                  {/* <SketchField
                  width="1024px"
                  height="768px"
                  ref={(c) => (this._sketch = c)}
                  tool={""}
                  lineColor="black"
                  lineWidth={3}
                  backgroundColor={
                    this.state.fillWithBackgroundColor
                      ? this.state.backgroundColor
                      : "transparent"
                  }
                  onChange={this._onSketchChange}
                /> */}
                  {/* <CanvasDraw canvasWidth="1024px" canvasHeight="768px" /> */}
                  <Whiteboard
                    socket={socket}
                    strokeColor={this.state.strokeColor}
                    username={this.state.username}
                    room={this.state.room}
                    ref={this.whiteboard}
                    drawings={this.state.drawings}
                    redo={this.state.redo}
                    undo={this.state.undo}
                    pushToDrawings={this.pushToDrawings}
                    clearDrawingsAndRedo={this.clearDrawingsAndRedo}
                    drawStartBoard={this.drawStartBoard}
                    clearWhiteboard={this.clearWhiteboard}
                    handleLoadFromJson={this.handleLoadFromJson}
                    map={this.state.map}
                  ></Whiteboard>
                </div>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </div>
    );
  }
}
export default WhiteboardContainer;
