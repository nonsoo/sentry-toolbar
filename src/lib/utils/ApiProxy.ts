import type {Configuration} from 'toolbar/types/config';

type Resolve = (value: unknown) => void;
type Reject = (reason?: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

type HandleStatusChange = (status: ProxyState) => void;
export interface ProxyState {
  loginComplete: boolean;
  hasCookie: boolean;
  hasProject: boolean;
  hasPort: boolean;
}

let _SINGLETON: ApiProxy | undefined;

function log(...args: unknown[]) {
  // eslint-disable-next-line no-constant-condition
  if (false) {
    console.log('IFrameProxy', ...args);
  }
}

export default class ApiProxy {
  /**
   * The last reported status of the proxy.
   */
  private _status: ProxyState = {loginComplete: false, hasCookie: false, hasProject: false, hasPort: false};

  /**
   * Callback to tell the initializer if we're ready or not. This can be called
   * any time a 403 response is returned to the `proxyFetch()` helper.
   */
  private _updateStatusCallback: HandleStatusChange = () => {};

  /**
   * The port that we're using to send messages into the iframe.
   */
  private _port: undefined | MessagePort;

  /**
   * A UUID (counter) that uniquely tracks each request to the iframe, in order
   * to correlate responses with the promiseMap
   */
  private _sequence = 0;

  /**
   * The promise resolve/reject functions that are outstanding and need to be
   * satisfied by a response from the iframe.
   */
  private _promiseMap = new Map<number, [Resolve, Reject]>();

  public static singleton(config: Configuration): ApiProxy {
    if (!_SINGLETON) {
      _SINGLETON = new ApiProxy(config);
    }
    return _SINGLETON;
  }

  public static TEST_ONLY_clear_singleton() {
    _SINGLETON = undefined;
  }

  private constructor(private _config: Configuration) {
    window.addEventListener('message', this._handleWindowMessage);
  }

  public setOnStatusChanged(onStatusChanged: HandleStatusChange) {
    this._updateStatusCallback = onStatusChanged;
  }

  public cleanup() {
    this._port?.removeEventListener('message', this._handlePortMessage);
    this._port?.close();
    this._port = undefined;
    this._updateStatus({loginComplete: false, hasCookie: false, hasProject: false, hasPort: false});
  }

  private _updateStatus(status: ProxyState) {
    log('Status changed', this._status, '-->', status);
    this._status = status;
    this._updateStatusCallback(status);
  }

  get status() {
    return this._status;
  }

  private _handleWindowMessage = (event: MessageEvent) => {
    if (event.origin !== this._config.sentryOrigin || event.data.source !== 'sentry-toolbar') {
      return; // Ignore other message sources
    }

    log('window._handleWindowMessage', event.data, event);
    switch (event.data.message) {
      case 'login-complete':
        // When the user is logged in, but the project is not setup for this domain
        this._updateStatus({
          ...this.status,
          loginComplete: true,
        });
        break;
      case 'cookie-found':
        // When the user is logged in, but the project is not setup for this domain
        this._updateStatus({
          ...this.status,
          hasCookie: true,
          hasProject: false,
        });
        break;
      case 'domain-allowed':
        // The user is logged in, and ready to go!
        this._updateStatus({
          ...this.status,
          hasCookie: true,
          hasProject: true,
        });
        break;
      case 'port-connect': {
        // We're getting the port from the iframe, for bidirectional comms
        try {
          const port = event.ports[0];
          this._port = port;
          port.addEventListener('message', this._handlePortMessage);
          port.start();
          this._updateStatus({
            ...this.status,
            hasPort: true,
          });
        } catch (error) {
          log('port-connect -> error', error);
        }
        break;
      }
    }
  };

  private _handlePortMessage = (e: MessageEvent) => {
    log('port._handlePortMessage', e.data);
    const $id = e.data.$id;
    if (!$id) {
      return; // MessageEvent is malformed without an $id
    }
    if (!this._promiseMap.has($id)) {
      return; // Message was handled already?
    }

    const [resolve, reject] = this._promiseMap.get($id) as [Resolve, Reject];
    this._promiseMap.delete($id);

    if ('$result' in e.data) {
      resolve(e.data.$result);
    } else {
      reject(e.data.$error);
    }
  };

  private postMessage = (signal: AbortSignal, message: unknown, transfer?: Transferable[]) => {
    log('postMessage()', message);
    if (!this._port) {
      log('no port open, dropping message', message);
      return;
    }

    return new Promise((resolve, reject) => {
      const $id = ++this._sequence;
      this._promiseMap.set($id, [resolve, reject]);
      log('port.postMessage() => ', {$id, message, transfer});

      signal.addEventListener(
        'abort',
        () => {
          this._promiseMap.delete($id);
          reject('Request was aborted');
        },
        {once: true}
      );

      this._port?.postMessage({$id, message}, transfer ?? []);
    });
  };

  public exec = (signal: AbortSignal, $function: 'log' | 'fetch', $args: unknown[]) => {
    return this.postMessage(signal, {$function, $args});
  };
}
