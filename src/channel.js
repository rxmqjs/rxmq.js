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
    subject(name, {Subject = EndlessSubject} = {}) {
        let s = this.utils.findSubjectByName(this.subjects, name);
        if (!s) {
            s = new Subject();
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
    request({topic, data, Subject = Rx.AsyncSubject}) {
        const subj = this.utils.findSubjectByName(this.subjects, topic);
        if (!subj) {
            return Rx.Observable.never();
        }

        const replySubject = new Subject();
        subj.onNext({replySubject, data});
        return replySubject;
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
