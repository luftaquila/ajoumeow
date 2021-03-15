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

class Log {
  constructor(level, IP, endpoint, description, method, status, query, result) {
    this.level = level;
    this.IP = IP;
    this.endpoint = endpoint;
    this.description = description;
    this.method = method;
    this.status = status;
    this.query = query;
    this.result = result;
  }
}

export { Response, Log }