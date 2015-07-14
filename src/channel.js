import Rx from 'rx';
import {EndlessSubject} from './rx';
import {findSubjectByName, compareTopics} from './utils';

/**
 * Rxmq channel class
 */
class Channel {
    /**
    * Represents a new Rxmq channel.
    * Normally you wouldn't need to instantiate it directly, you'd just work with existing instance.
    * @constructor
    * @param  {Array}   plugins  Array of plugins for new channel
    * @return {void}
    */
    constructor(plugins = []) {
        /**
         * Internal set of utilities
         * @type {Object}
         * @private
         */
        this.utils = {
            findSubjectByName,
            compareTopics,
        };

        /**
         * Instances of subjects
         * @type {Array}
         * @private
         */
        this.subjects = [];
        /**
         * Channel bus
         * @type {EndlessSubject}
         * @private
         */
        this.channelBus = new EndlessSubject();
        /**
         * Permanent channel bus stream as Rx.Observable
         * @type {Rx.Observable}
         * @private
         */
        this.channelStream = this.channelBus.publish().refCount();

        // inject plugins
        plugins.map(this.registerPlugin.bind(this));
    }

    /**
     * Returns EndlessSubject representing given topic
     * @param  {String}         name        Topic name
     * @return {EndlessSubject}             EndlessSubject representing given topic
     * @example
     * const channel = rxmq.channel('test');
     * const subject = channel.subject('test.topic');
     */
    subject(name) {
        let s = this.utils.findSubjectByName(this.subjects, name);
        if (!s) {
            s = new EndlessSubject();
            s.name = name;
            this.subjects.push(s);
            this.channelBus.onNext(s);
        }
        return s;
    }

    /**
     * Get an Rx.Observable for specific set of topics
     * @param  {String}         name        Topic name / pattern
     * @return {Rx.Observable}              Rx.Observable for given set of topics
     * @example
     * const channel = rxmq.channel('test');
     * channel.observe('test.topic')
     *        .subscribe((res) => { // default Rx.Observable subscription
     *            // handle results
     *        });
     */
    observe(name) {
        // create new topic if it's plain text
        if (name.indexOf('#') === -1 && name.indexOf('*') === -1) {
            return this.subject(name);
        }
        // return stream
        return this.channelStream.filter((obs) => compareTopics(obs.name, name)).mergeAll();
    }

    /**
     * Alias for subscription to a specific topic using given handler functions
     * @param  {Object}        options      Subscription options
     * @param  {String}        options.topic        Topic name
     * @param  {Function}      options.onNext       Function handler for Rx.Observable onNext
     * @param  {Function}      options.onError      Function handler for Rx.Observable onError
     * @param  {Function}      options.onCompleted  Function handler for Rx.Observable onCompleted
     * @return {Rx.Disposable}                      Disposable subscription
     * @example
     * const channel = rxmq.channel('test');
     * channel.subscribeTo({
     *     topic: 'test.topic',
     *     onNext: (res) => {
     *         // handle stuff here
     *     },
     *     onError: console.error,
     *     onCompleted: () => console.log('done!'),
     * });
     */
    subscribeTo({topic, onNext, onError, onCompleted}) {
        return this.observe(topic).subscribe(onNext, onError, onCompleted);
    }
    /**
     * Alternative alias for subscription to specific topic using given handler functions
     * @param  {(String|Object)} topic                  Topic name or options object formatted like for '.subscribeTo()'
     * @param  {Object}          options                Handlers object
     * @param  {Function}        options.onNext         Function handler for Rx.Observable onNext
     * @param  {Function}        options.onError        Function handler for Rx.Observable onError
     * @param  {Function}        options.onCompleted    Function handler for Rx.Observable onCompleted
     * @return {Rx.Disposable}                          Disposable subscription
     * @example
     * const channel = rxmq.channel('test');
     * channel.subscribe('test.topic', {
     *     onNext: (res) => {
     *         // handle stuff here
     *     },
     *     onError: console.error,
     *     onCompleted: () => console.log('done!'),
     * });
     */
    subscribe(topic, {onNext, onError, onCompleted}) {
        if (typeof topic === 'object') {
            const {topic: newTopic, onNext: newOnNext, onError: newOnError, onCompleted: newOnCompleted} = topic;
            topic = newTopic;
            onNext = newOnNext;
            onError = newOnError;
            onCompleted = newOnCompleted;
        }

        return this.subscribeTo({topic, onNext, onError, onCompleted});
    }

    /**
     * Alias for a trigger '.onNext()' for specific topic
     * @param  {String} topic       Topic name
     * @param  {Object} data      Data to dispatch
     * @return {void}
     * @example
     * const channel = rxmq.channel('test');
     * channel.onNextTo({
     *     topic: 'test.topic',
     *     data: 'test data',
     * });
     */
    onNextTo({topic, data}) {
        this.subject(topic).onNext(data);
    }
    /**
     * Alternative alias for a trigger '.onNext()' for specific topic
     * @param  {(String|Object)} topic      Topic name or params object formatted like for `.onNextTo()`
     * @param  {Object}          data       Data to dispatch
     * @return {void}
     * @example
     * const channel = rxmq.channel('test');
     * channel.onNext('test.topic', {
     *     data: 'test data',
     * });
     */
    onNext(topic, {data} = {}) {
        if (typeof topic === 'object') {
            const {topic: newTopic, data: newData} = topic;
            topic = newTopic;
            data = newData;
        }

        this.onNextTo({topic, data});
    }

    /**
     * Do a request that will be replied into returned Rx.AsyncSubject
     * Alias for '.request()' that uses single object as params
     * @param  {Object}      options                   Request options
     * @param  {String}      options.topic             Topic name
     * @param  {Any}         options.data              Request data
     * @param  {Object}      options.DefaultSubject    Rx.Subject to be used for response, defaults to Rx.AsyncSubject
     * @return {Rx.AsyncSubject}                       AsyncSubject that will dispatch the response
     * @example
     * const channel = rxmq.channel('test');
     * channel.requestTo({
     *     topic: 'test.topic',
     *     data: 'test data',
     * }).subscribe((response) => { // default Rx.Observable subscription
     *     // handle response
     * });
     */
    requestTo({topic, data, DefaultSubject = Rx.AsyncSubject}) {
        const subj = this.utils.findSubjectByName(this.subjects, topic);
        if (!subj) {
            return Rx.Observable.never();
        }

        const replySubject = new DefaultSubject();
        subj.onNext({replySubject, data});
        return replySubject;
    }
    /**
     * Do a request that will be replied into returned Rx.AsyncSubject
     * @param  {(String|Object)} topic                   Topic name or options object formatted like for '.requestTo()'
     * @param  {Object}          options                 Request options
     * @param  {Object}          options.data            Request data
     * @param  {Object}          options.DefaultSubject  Rx.Subject to be used for response, defaults to Rx.AsyncSubject
     * @return {Rx.AsyncSubject}                         AsyncSubject that will dispatch the response
     * @example
     * const channel = rxmq.channel('test');
     * channel.request('test.topic', {
     *     data: 'test data',
     * }).subscribe((response) => { // default Rx.Observable subscription
     *     // handle response
     * });
     */
    request(topic, {data, DefaultSubject = Rx.AsyncSubject} = {}) {
        if (typeof topic === 'object') {
            const {topic: newTopic, data: newData, DefaultSubject: NewSubject} = topic;
            topic = newTopic;
            data = newData;
            DefaultSubject = NewSubject;
        }

        return this.requestTo({topic, data, DefaultSubject});
    }

    /**
     * Channel plugin registration
     * @param  {Object} plugin Plugin object to apply
     * @return {void}
     */
    registerPlugin(plugin) {
        for (const prop in plugin) {
            if (!this.hasOwnProperty(prop)) {
                /**
                 * Hide from esdoc
                 * @private
                 */
                this[prop] = plugin[prop];
            }
        }
    }
}

/**
 * Channel definition
 */
export default Channel;
