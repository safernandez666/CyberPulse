import * as vscode from 'vscode';

const EXT_ID = 'cyberpulse';

export function activate(context: vscode.ExtensionContext) {
  console.log(`[${EXT_ID}] Extension activated`);

  // ─── Register: Open CyberPulse in Sidebar ────────────────────────────
  const provider = new CyberPulseProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('cyberpulse.panel', provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  // ─── Register: Open CyberPulse in Editor Tab ─────────────────────────
  const openCmd = vscode.commands.registerCommand(`${EXT_ID}.open`, () => {
    const panel = vscode.window.createWebviewPanel(
      `${EXT_ID}.editor`,      // panel ID
      'CyberPulse',             // title
      vscode.ViewColumn.One,    // show in first column
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableFindWidget: true,
      }
    );

    const url = getConfigUrl();
    panel.webview.html = getWebviewHtml(panel.webview, context.extensionUri, url);
    setupMessageHandler(panel.webview);

    // Show info message
    vscode.window.showInformationMessage(
      'CyberPulse opened! Generate LinkedIn posts from real-time cybersecurity news.',
      'Dismiss'
    );
  });
  context.subscriptions.push(openCmd);

  // ─── Register: Open Settings ────────────────────────────────────────
  const settingsCmd = vscode.commands.registerCommand(
    `${EXT_ID}.openSettings`,
    () => {
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'cyberpulse'
      );
    }
  );
  context.subscriptions.push(settingsCmd);

  // ─── Status Bar Item ────────────────────────────────────────────────
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBar.text = '$(pulse) CyberPulse';
  statusBar.tooltip = 'Click to open CyberPulse';
  statusBar.command = `${EXT_ID}.open`;
  statusBar.show();
  context.subscriptions.push(statusBar);
}

export function deactivate() {
  console.log(`[${EXT_ID}] Extension deactivated`);
}

/* ─────────────────────────────────────────────────────────────────────── */

function getConfigUrl(): string {
  const cfg = vscode.workspace.getConfiguration('cyberpulse');
  return cfg.get<string>('url') || 'https://6xyrrp7uai5gg.kimi.page';
}

function getWebviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  url: string
): string {
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${url} https:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
  <title>CyberPulse</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #container { width: 100%; height: 100%; overflow: hidden; }
    #loading {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: #0A0A0A; color: #CCFF00; font-family: system-ui, sans-serif;
      z-index: 10; transition: opacity 0.3s;
    }
    #loading.hidden { opacity: 0; pointer-events: none; }
    #loading svg { margin-bottom: 16px; }
    #loading h1 { font-size: 24px; margin-bottom: 8px; }
    #loading h1 span { color: #E5E5E5; }
    #loading p { color: #808080; font-size: 13px; }
    #loading .spinner {
      width: 32px; height: 32px; border: 3px solid #222;
      border-top-color: #CCFF00; border-radius: 50%;
      animation: spin 1s linear infinite; margin-top: 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    iframe {
      width: 100%; height: 100%; border: none;
      background: #0A0A0A;
    }
  </style>
</head>
<body>
  <div id="loading">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CCFF00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
    <h1>Cyber<span>Pulse</span></h1>
    <p>Loading cybersecurity news & LinkedIn post generator...</p>
    <div class="spinner"></div>
  </div>

  <div id="container">
    <iframe
      id="frame"
      src="${url}"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
      allow="clipboard-read; clipboard-write"
    ></iframe>
  </div>

  <script nonce="${nonce}">
    const iframe = document.getElementById('frame');
    const loading = document.getElementById('loading');

    iframe.onload = function() {
      loading.classList.add('hidden');
    };

    // Hide loading after 5s max even if iframe doesn't fire onload
    setTimeout(() => loading.classList.add('hidden'), 5000);
  </script>
</body>
</html>`;
}

function setupMessageHandler(webview: vscode.Webview) {
  webview.onDidReceiveMessage(
    (message) => {
      switch (message.type) {
        case 'copy':
          vscode.env.clipboard.writeText(message.text);
          vscode.window.showInformationMessage('Copied to clipboard!');
          break;
        case 'post':
          vscode.window.showInformationMessage(
            'Post ready! Paste it into LinkedIn.',
            'Open LinkedIn'
          ).then((selection) => {
            if (selection === 'Open LinkedIn') {
              vscode.env.openExternal(
                vscode.Uri.parse('https://www.linkedin.com/post/new')
              );
            }
          });
          break;
      }
    },
    undefined,
    []
  );
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/* ─── Sidebar Webview Provider ─────────────────────────────────────── */

class CyberPulseProvider implements vscode.WebviewViewProvider {
  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    const url = getConfigUrl();
    webviewView.webview.html = getWebviewHtml(
      webviewView.webview,
      this._extensionUri,
      url
    );
    setupMessageHandler(webviewView.webview);

    webviewView.title = 'CyberPulse';
  }
}
