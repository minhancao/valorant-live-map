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
  EditOutlined,
} from "@ant-design/icons";
import { CompactPicker } from "react-color";
import "antd/dist/antd.css"; // or 'antd/dist/antd.less'
import CanvasDraw from "react-canvas-draw";
import Whiteboard from "./Whiteboard";

const { Header, Content, Footer, Sider } = Layout;
const { SubMenu } = Menu;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      endpoint: "localhost:5000",
      socket: socketIOClient("localhost:5000"),
      collapsed: false,
      strokeColor: "black",
    };
    this.whiteboard = React.createRef();
  }

  componentDidMount() {
    this.state.socket.on("change backgroundColor", (backgroundCol) => {
      console.log("change backgroundcol");
      this.setState({
        backgroundColor: backgroundCol,
      });
    });
    this.state.socket.on("change fillWithBackgroundColor", (fillBg) => {
      console.log("change fillbg");
      this.setState({
        fillWithBackgroundColor: fillBg,
      });
    });
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
        this.state.socket.emit(
          "change fillWithBackgroundColor",
          this.state.fillWithBackgroundColor
        );
      }
    );
  };

  // adding the function
  setBackgroundColor = (backgroundColor) => {
    this.setState({ backgroundColor }, () => {
      this.state.socket.emit(
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
      <div>
        <Layout style={{ minHeight: "100vh" }}>
          <Sider
            width="35%"
            breakpoint="sm"
            collapsedWidth="0"
            collapsible
            collapsed={this.state.collapsed}
            onCollapse={this.onCollapse}
          >
            <div className="logo" />
            <Menu theme="dark" defaultSelectedKeys={["1"]} mode="inline">
              <Menu.Item key="1">
                <Input
                  style={{ width: "30%" }}
                  size="small"
                  label="Image URL"
                  onChange={(e) => this.setState({ imageUrl: e.target.value })}
                  value={this.state.imageUrl}
                />
                <Button
                  variant="outlined"
                  onClick={(e) => {
                    this._sketch.addImg(this.state.imageUrl);
                  }}
                >
                  Load Image from URL
                </Button>
              </Menu.Item>
              <Menu.Item key="2" icon={<UploadOutlined />}>
                <label style={{ cursor: "pointer" }} for="uploadimage">
                  Upload Image
                </label>
                <input
                  style={{ display: "none" }}
                  id="uploadimage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    this._onImageDrop(e.target.files);
                  }}
                ></input>
              </Menu.Item>

              <Menu.Item
                key="3"
                icon={<BgColorsOutlined />}
                style={{ height: "100px" }}
              >
                <Switch
                  checked={this.state.fillWithBackgroundColor}
                  onChange={(e) => this.setFillWithBackgroundColor()}
                />
                <CompactPicker
                  color={this.state.backgroundColor}
                  onChange={(color) => this.setBackgroundColor(color.hex)}
                />
              </Menu.Item>
              <Menu.Item
                key="4"
                icon={<EditOutlined />}
                style={{ height: "100px" }}
              >
                <CompactPicker
                  color={this.state.strokeColor}
                  onChange={(color) =>
                    this.setState({ strokeColor: color.hex })
                  }
                />
              </Menu.Item>
            </Menu>
          </Sider>
          <Layout className="site-layout">
            <Content style={{ margin: "0 16px" }}>
              <div
                ref="drawArea"
                className="site-layout-background"
                style={{
                  padding: 24,
                  minHeight: 360,
                  height: "auto",
                  backgroundColor: this.state.fillWithBackgroundColor
                    ? this.state.backgroundColor
                    : "transparent",
                  background:
                    "url('https://blitz-cdn-plain.blitz.gg/blitz/val/maps/bind/images/bind-layout-offense5.svg')",
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
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
                  socket={this.state.socket}
                  strokeColor={this.state.strokeColor}
                ></Whiteboard>
              </div>
            </Content>
          </Layout>
        </Layout>
      </div>
    );
  }
}
export default App;
