import Rx from 'rx';
import {EndlessSubject} from './rx';
import {findSubjectsByName, compareTopics} from './utils';

class Channel {
    constructor(plugins = []) {
        // expose functions to plugins
        this.utils = {
            findSubjectsByName,
            compareTopics,
        };

        // init data
        this.subjects = [];
        this.channelBus = new EndlessSubject();
        this.channelStream = this.channelBus.publish().refCount();

        // inject plugins
        plugins.map(this.registerPlugin.bind(this));
    }

    // returns topic
    subject(name) {
        let s = findSubjectsByName(this.subjects, name);
        if (!s) {
            s = new EndlessSubject();
            s.name = name;
            this.subjects.push(s);
            this.channelBus.onNext(s);
        }
        return s;
    }

    // returns observable
    observe(name) {
        // create new topic if it's plain text
        if (name.indexOf('#') === -1 && name.indexOf('*') === -1) {
            return this.subject(name);
        }
        // return stream
        return this.channelStream.filter((obs) => compareTopics(obs.name, name)).mergeAll();
    }

    subscribe({topic, onNext, onError, onCompleted}) {
        return this.observe(topic).subscribe(onNext, onError, onCompleted);
    }

    onNext({topic, data}) {
        this.subject(topic).onNext(data);
    }

    request(topic, {data} = {}) {
        if (typeof topic === 'object') {
            const {topic: newTopic, data: newData} = topic;
            topic = newTopic;
            data = newData;
        }

        const subj = this.utils.findSubjectsByName(this.subjects, topic);
        if (!subj) {
            return Rx.Observable.never();
        }

        const replySubject = new Rx.AsyncSubject();
        subj.onNext({replySubject, data});
        return replySubject;
    }

    registerPlugin(plugin) {
        for (const prop in plugin) {
            if (!this.hasOwnProperty(prop)) {
                this[prop] = plugin[prop];
            }
        }
    }
}

export default Channel;
