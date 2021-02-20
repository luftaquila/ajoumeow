$(function() {
  const jwt = Cookies.get('jwt');
  if(jwt) { // if jwt exists
    $.ajax({
      url: "/ajoumeow/api/auth/autologin",
      beforeSend: xhr => xhr.setRequestHeader('x-access-token', jwt),
      type: "POST",
      success: res => { if(res.data.user.role == '회원') window.location.href = "/403.html"; },
      error: () => window.location.href = "/403.html"
    });
  }
  else window.location.href = "/403.html";
});

function dataSize(s, b, i, c) { for(b = i = 0; c = s.charCodeAt(i++); b += c >> 11 ? 3 : c >> 7 ? 2 : 1); return b; }
var dateFormat = function () {
  var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
      pad = function (val, len) {
        val = String(val);
        len = len || 2;
        while (val.length < len) val = "0" + val;
        return val;
      };
  return function (date, mask, utc) {
    var dF = dateFormat;
    if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
      mask = date;
      date = undefined;
    }
    date = date ? new Date(date) : new Date;
    var	_ = utc ? "getUTC" : "get",
      d = date[_ + "Date"](),
      m = date[_ + "Month"](),
      y = date[_ + "FullYear"](),
      H = date[_ + "Hours"](),
      M = date[_ + "Minutes"](),
      s = date[_ + "Seconds"](),
      flags = {
        d:    d,
        dd:   pad(d),
        m:    m + 1,
        mm:   pad(m + 1),
        yyyy: y,
        HH:   pad(H),
        MM:   pad(M),
        ss:   pad(s),
      };
    return mask.replace(token, function ($0) {
      return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
  };
}();
Date.prototype.format = function (mask, utc) { return dateFormat(this, mask, utc); };
Date.prototype.getDayNum = function() { return this.getDay() ? this.getDay() : 7; }
  