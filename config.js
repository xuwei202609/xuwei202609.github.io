// The survey return URL can be configured when available.
window.BELONG_CONFIG = {
  surveyReturnUrl: '',
  reflectionApiBaseUrl: 'https://belong-dei-chat-api.happycharm35.chatgpt.site',
  chatApiBaseUrl: ['localhost', '127.0.0.1'].includes(location.hostname)
    ? ''
    : 'https://belong-dei-chat-api.happycharm35.chatgpt.site'
};

