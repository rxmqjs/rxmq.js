import Channel from './channel';

class Rxmq {
    constructor() {
        this.channels = {};
        this.channelPlugins = [];
    }

    channel(name = 'defaultRxmqChannel') {
        if (!this.channels[name]) {
            this.channels[name] = new Channel(this.channelPlugins);
        }

        return this.channels[name];
    }

    observe({channel, topic}) {
        return this.channel(channel).observe(topic);
    }

    subscribe({channel, topic, onNext, onError, onCompleted}) {
        return this.channel(channel).observe(topic).subscribe(onNext, onError, onCompleted);
    }

    onNext({channel, topic, data}) {
        this.channel(channel).subject(topic).onNext(data);
    }

    registerPlugin(plugin) {
        for (const prop in plugin) {
            if (!this.hasOwnProperty(prop)) {
                this[prop] = plugin[prop];
            }
        }
    }

    registerChannelPlugin(plugin) {
        this.channelPlugins.push(plugin);
        for (const name in this.channels) {
            this.channels[name].registerPlugin(plugin);
        }
    }
}

export default Rxmq;
