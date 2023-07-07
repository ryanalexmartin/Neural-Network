const sendButton = document.querySelector('#send-button');
sendButton.addEventListener('click', (event) => {
    event.preventDefault();
    const name = document.querySelector('#name').value;
    const company = document.querySelector('#company').value;
    const subject = name + ' from ' + company;
    const inquiry = document.querySelector('#inquiry').value;
    const body = inquiry;
    email='nazar@nazar-ai.com'
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
});
