class Response {
  constructor(stat, msg, data) {
    this.stat = stat;
    this.msg = msg;
    this.data = data;
  }
  toJson() {
    return JSON.stringify(this);
  }
}

export default Response;