import { defineStore } from 'pinia';
import { arrayRemoveElement } from '../functions/Utils';

export const useConnectorStore = defineStore('connector', {
    state: () => ({
        wsConnectionStore: null,
        toastsStore: useToastsStore(),
        callbacks: {},
        _initDone: false,
    }),
    getters: {
        isConnected() {
            return this.wsConnectionStore.isConnected;
        },
    },
    actions: {
        init(url = null, autoReconnectTime = 4000, attempts = 5) {
            if (this._initDone) return;

            if (!url) {
                url = document.location.origin.replace('http', 'ws');
                // url = window.location.origin.replace(/^http/, 'ws') + '/ws';
            }
            this.wsConnectionStore = useWsConnectionStore().init(url, autoReconnectTime, attempts);

            this.bind('message', this.handleMessage);
            // this.bind('message', console.info);
            this.bind('open', () => {
                console.info('connector opened');

                this.toastsStore.addToast({
                    titleText: "WsConnector",
                    bodyText: "Uzyskano połączenie z aplikacją wsConnector"
                });
            });
            this.bind('close', () => {
                console.warn('connector closed');

                if (this.wsConnectionStore.remainAttempts == this.wsConnectionStore.attempts) {
                    this.toastsStore.addToast({
                        titleText: "WsConnector",
                        bodyText: "Brak połączenia z aplikacją wsConnector, włącz wsConnector, aby móc korzystać z funkcji połączeń"
                    });
                }
            });
            this.bind('error', console.warn);
            this._initDone = true;
        },
        connect() {
            this.wsConnectionStore.connect();
        },
        disconnect() {
            this.wsConnectionStore.disconnect();
        },
        sendData(type, message, callback = null) {
            if (!this.isConnected) {
                return false;
            }
            // const id = (Math.random() + '').replace('0.', '');
            const id = Math.random();
            var socketMessage = JSON.stringify({ id: id, type: type, data: message });
            this.wsConnectionStore.send(socketMessage);
            if (callback) {
                this.callbacks[id] = callback;
                return id;
            }
            return true;
        },
        removeCallback(id) {
            delete this.callbacks[id];
        },
        bind(event_name, callback) {
            this.wsConnectionStore.bind(event_name, callback);
        },
        unbind(event_name, callback) {
            this.wsConnectionStore.unbind(event_name, callback);
        },
        handleMessage(event) {
            const data = JSON.parse(event);
            if (data.id && this.callbacks[data.id]) {
                this.callbacks[data.id](data);
                delete this.callbacks[data.id];
            }
        },
    },
});

export const useWsConnectionStore = defineStore('wsConnection', {
    state: () => ({
        callbacks: {},
        attempts: 0,
        remainAttempts: 0,
        ws_autoReconnectTime: -1,
        ws_url: null,
        conn: null,
        isConnected: false,
    }),
    getters: {
    },
    actions: {
        _isConnected() {
            this.isConnected = (this.conn && this.conn.readyState == WebSocket.OPEN);
            return this.isConnected;
        },
        init(url, autoReconnectTime = -1, attempts = 0) {
            this.ws_url = url;
            this.ws_autoReconnectTime = autoReconnectTime;
            this.attempts = attempts;
            this.remainAttempts = this.attempts;
            return this;// chainable
        },
        bind(event_name, callback) {
            this.callbacks[event_name] = this.callbacks[event_name] || [];
            this.callbacks[event_name].push(callback);
            return this;// chainable
        },
        unbind(event_name, callback) {
            if (this.callbacks[event_name])
                arrayRemoveElement(this.callbacks[event_name], callback);
            return this;// chainable
        },
        send(event_data) {
            if (this._isConnected())
                this.conn.send(event_data);
            return this;// chainable
        },
        connect() {
            if (this.conn && (this.conn.readyState === WebSocket.CONNECTING || this.conn.readyState === WebSocket.OPEN))
                return this;

            if (typeof (MozWebSocket) == 'function')
                // eslint-disable-next-line no-undef
                this.conn = new MozWebSocket(ws_url);
            else
                this.conn = new WebSocket(this.ws_url);

            // dispatch to the right handlers
            this.conn.onopen = () => {
                this.dispatch('open', null);
                this.isConnected = true;
                this.remainAttempts = this.attempts;
            };
            this.conn.onclose = () => {
                this.dispatch('close', null);
                this.isConnected = false;
                if (this.remainAttempts-- > 0 && this.ws_autoReconnectTime >= 0) {
                    setTimeout(() => {
                        this.connect();
                    }, this.ws_autoReconnectTime);
                }
            };
            this.conn.onerror = (evt) => {
                this.dispatch('error', evt.data);
            };
            this.conn.onmessage = (evt) => {
                this.dispatch('message', evt.data);
            };
            return this;// chainable
        },
        disconnect(doNotReconnect = false) {
            if (doNotReconnect) {
                this.remainAttempts = 0;
            }
            if (this._isConnected()) {
                this.isConnected = false;
                this.conn.close();
            }
        },
        dispatch(event_name, message) {
            var chain = this.callbacks[event_name];
            if (typeof chain == 'undefined') return; // no callbacks for this event
            for (var i = 0; i < chain.length; i++) {
                chain[i](message);
            }
        },
    },
});