export default class SimpleSendData {
    toSendData() {
        console.warn("toSendData called on SimpleSendData, should be overridden in subclass");
        return {};
    }

    toString() {
        return JSON.stringify(this.toSendData());
    }
}
