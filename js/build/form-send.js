"use strict";

var sendButton = document.querySelector('#send-button');
sendButton.addEventListener('click', function (event) {
  event.preventDefault();
  var name = document.querySelector('#name').value;
  var company = document.querySelector('#company').value;
  var subject = name + ' from ' + company;
  var inquiry = document.querySelector('#inquiry').value;
  var body = inquiry;
  email = 'nazar@nazar-ai.com';
  window.location.href = "mailto:".concat(email, "?subject=").concat(subject, "&body=").concat(body);
});
//# sourceMappingURL=form-send.js.map
