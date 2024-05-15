document.onreadystatechange = function() {
  if (document.readyState === 'interactive') renderApp();
  function renderApp() {
    var onInit = app.initialized();

    onInit.then(getClient).catch(handleErr);

    function getClient(_client) {
      window.client = _client;
      window.client.iparams.get('widgetURL').then((value) => {
        window.widgetURL = value.widgetURL;
      }).catch(() => console.error('Error in fetching iparam'));
    }
  }
};

function handleErr(err) {
  console.error(`Error occured. Details:`, err);
}

function initFreshchatWidget() {
  window.fcWidgetMessengerConfig = {
    open: true,
    config: {
      eagerLoad: true,
      headerProperty: {
        //hideChatButton: true,
      },
    },
    ...window.fcConfig,
  };
  window.fcSettings = {
    config: {
      cssNames: {
        widget: 'custom_fc_frame',
      }
    },
    onInit: function() {
      console.log('FcWidgetTestApp:: widget init');
      window.fcWidget.setExternalId(window.fcConfig.externalId);
      //window.fcWidget.user.setEmail(window.fcConfig.email);
    }
  }
  const freshchatScript = document.createElement('script');

  freshchatScript.src = window.widgetURL;
  freshchatScript.setAttribute('chat', 'true');
  freshchatScript.id = 'freshchatScript';
  freshchatScript.onload = () => {
    window.fwcrm.on('widget:loaded', () => {
      window.initFreshchatEvents();
      window.fcWidget.user.get(function(resp) {
        console.log('FcWidgetTestApp:: widget:loaded', resp);
        if(resp.status === 200) {
          document.getElementById('user-external-id').innerText = resp.data.externalId;
        }
      });
    });
  };
  const head = document.head || document.getElementsByTagName('head')[0];

  head.insertBefore(freshchatScript, head.firstChild);
}

function initFreshchatEvents() {
  window.fcWidget.off('user:cleared');
  window.fcWidget.on('user:cleared', () => {
    window.fcWidget.destroy();
  });

  window.fcWidget.off('user:destroyed');
  window.fcWidget.on('widget:destroyed', () => {
    const scriptToRemove = document.getElementById('freshchatScript');
    const head = document.head || document.getElementsByTagName('head')[0];

    if (scriptToRemove) {
      head.removeChild(scriptToRemove);
    }
    initFreshchatWidget();
  });

  window.fcWidget.off('user:created');
  window.fcWidget.on('user:created', function(resp) {
    console.log('FcWidgetTestApp:: user:created', resp);
    if(resp.status === 200) {
      document.getElementById('user-external-id').innerText = resp.data.externalId;
    }
  });
}

function createFcWidget(config) {
  window.fcConfig = config;
  if (window.fcWidget && window.fcWidget.isInitialized() === true) {
    window.fcWidget.user.isExists().then(
        (data) => {
          if (data.data && data.success) {
            console.log('FcWidgetTestApp:: user exists');
            window.fcWidget.user.clear();
          } else {
            console.log('FcWidgetTestApp:: user not exists');
            window.fcWidget.destroy();
          }
        },
        () => null,
    );
  } else {
    this.initFreshchatWidget();
  }
}

document.getElementById('new-visitor').addEventListener('click', function() {
  let externalId = Math.floor(Math.random() * 9000000000) + 1000000000;
  createFcWidget({
    externalId: "" + externalId
  });
});

document.getElementById('submit').addEventListener('click', function() {
  let externalId = document.getElementById('external-id').value;

  document.getElementById('user-external-id').innerText = externalId;

  createFcWidget({
    externalId: externalId
  });

  document.getElementById('existing-user-dialog-box').style.display = 'none';
});

document.getElementById('cancel').addEventListener('click', function() {
  document.getElementById('existing-user-dialog-box').style.display = 'none';
});

document.getElementById('existing-user').addEventListener('click', function() {
  document.getElementById('existing-user-dialog-box').style.display = 'block';
});
