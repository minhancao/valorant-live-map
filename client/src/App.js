// Updated. Thanks to: Paul Luna
import React, { Component } from "react";
import WhiteboardContainer from "./components/WhiteboardContainer";
import "./App.css";
import { Form, Input, Button } from "antd";

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};
const tailLayout = {
  wrapperCol: { offset: 8, span: 16 },
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      typing: "",
      room: "",
    };
  }

  onFinish = (values) => {
    this.setState({
      username: values.username,
      room: values.room.toUpperCase(),
    });
  };

  onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  clearRoom = () => {
    this.setState({
      username: "",
      room: "",
    });
  };

  render() {
    return (
      <div>
        {this.state.username && this.state.room ? (
          <WhiteboardContainer
            clearRoom={this.clearRoom}
            {...this.state}
          ></WhiteboardContainer>
        ) : (
          <div>
            <h1 style={{ textAlign: "center" }}>Valorant Maps Drawing Rooms</h1>
            <Form
              {...layout}
              name="basic"
              initialValues={{ remember: true }}
              onFinish={this.onFinish}
              onFinishFailed={this.onFinishFailed}
            >
              <Form.Item
                label="Username"
                name="username"
                rules={[
                  { required: true, message: "Please input your username!" },
                ]}
              >
                <Input style={{ width: "50%" }} />
              </Form.Item>

              <Form.Item
                label="Room"
                name="room"
                rules={[{ required: true, message: "Please input a room!" }]}
              >
                <Input style={{ width: "50%" }} />
              </Form.Item>

              <Form.Item {...tailLayout}>
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </div>
    );
  }
}
export default App;
