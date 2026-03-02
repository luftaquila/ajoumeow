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

function success(data, meta) {
  const res = { data };
  if (meta) res.meta = meta;
  return res;
}

function error(code, message) {
  return { error: { code, message } };
}

export { Log, success, error }